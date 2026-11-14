# RunJS

A Node.js action for running inline JavaScript or importing a JavaScript module
in a workflow. Scripts have access to Git, npm, Gitea, and AI helpers.

## Usage

```yaml
steps:
  - uses: actions/checkout@v4
  - name: Run JavaScript
    id: script
    uses: https://git.vistta.org/tiago/runjs@v1
    with:
      target: inline
      run: |
        const version = await npm.version("--json");
        global.result = JSON.parse(version);
  - name: Read the result
    run: echo "$RESULT"
    env:
      RESULT: ${{ steps.script.outputs.result }}
```

The action URL above is for Gitea Actions. GitHub Actions users must reference a
GitHub-hosted copy or check out and build the action before using a local path.

### Import a file

```yaml
- name: Import a JavaScript module
  uses: https://git.vistta.org/tiago/runjs@v1
  with:
    target: filepath
    filepath: file://${{ github.workspace }}/scripts/job.mjs
```

Use an absolute file URL for reliable module resolution. Relative module
specifiers resolve from the action bundle, not from `working-directory`.
The module executes on import; an exported default function is not called.
Set `global.result` inside the module to produce an output.

## Inputs

| Input               | Required       | Description                                                                     |
| ------------------- | -------------- | ------------------------------------------------------------------------------- |
| `target`            | Yes            | Execution mode: `inline` or `filepath`.                                         |
| `run`               | For `inline`   | JavaScript executed inside an async function; top-level `await` is supported.   |
| `filepath`          | For `filepath` | Module specifier passed to dynamic `import()`, preferably an absolute file URL. |
| `working-directory` | No             | Changes the process directory before running code or helper commands.           |
| `context`           | No             | JSON used to initialize `gitea`. Defaults to `${{ toJson(github) }}`.           |

### Gitea API context

Gitea API helpers require `api_url`, a `repository` string in `owner/repo` format,
and a `token` with the permissions needed by the requested operation. Supply an
explicit context if the default workflow context does not contain these values:

```yaml
with:
  target: inline
  context: |
    {
      "api_url": "${{ github.api_url }}",
      "repository": "${{ github.repository }}",
      "token": "${{ secrets.GITEA_TOKEN }}"
    }
  run: |
    global.result = await gitea.issues.list({ state: "open" });
```

`api_url` must be the Gitea API base URL, typically ending in `/api/v1`, without a
trailing slash. The helpers use Gitea endpoints, not the GitHub API.

## AI text generation

Configure the helper with `ai.setup({ baseURL, model, apiKey })`, then call
`await ai.generate(prompt)` to receive generated text. `baseURL` and `model`
are required; `apiKey` is optional for local providers such as Ollama.
Calling `ai.generate` before `ai.setup` throws an error. Calling `ai.setup` again
replaces the configuration for subsequent requests.

The client sends a non-streaming request to the OpenAI-compatible
`/chat/completions` endpoint under `baseURL`. Include the API prefix in the base
URL, for example `https://api.openai.com/v1` or `http://localhost:11434/v1` for
Ollama. Choose a model available on your provider.

### Generate release notes

Configure the `AI_BASE_URL` and `AI_MODEL` repository variables and, if required,
the `AI_API_KEY` secret:

```yaml
- name: Generate release notes
  id: notes
  uses: https://git.vistta.org/tiago/runjs@v1
  env:
    AI_BASE_URL: ${{ vars.AI_BASE_URL }}
    AI_MODEL: ${{ vars.AI_MODEL }}
    AI_API_KEY: ${{ secrets.AI_API_KEY }}
    RELEASE_CHANGES: |
      Added inline JavaScript execution.
      Fixed module loading documentation.
  with:
    target: inline
    run: |
      ai.setup({
        baseURL: process.env.AI_BASE_URL,
        model: process.env.AI_MODEL,
        apiKey: process.env.AI_API_KEY,
      });
      global.result = await ai.generate(
        "Write concise Markdown release notes for these changes:\n\n" +
        process.env.RELEASE_CHANGES
      );
```

Replace the sample `RELEASE_CHANGES` with your changelog or an earlier step's
output. The generated text is available as `${{ steps.notes.outputs.result }}`
and can also be used as the `body` of a `gitea.releases.create` call.

Requests time out after 60 seconds. HTTP errors, invalid responses, and network
failures fail the action unless handled by your script. Error messages for HTTP
failures include the status code, not the provider response body.

Only send data you are authorized to share with the configured provider. In a
container job, `localhost` refers to that container, not the runner host; Ollama
must be reachable from the job environment.

## Script globals

- `git`: async wrappers for `commit`, `config`, `push`, `tag`, `clone`, `checkout`,
  `fetch`, `pull`, `merge`, and `reset`.
- `npm`: async wrappers for `install`, `publish`, `stage`, `version`, and `config`.
  Each wrapper forwards arguments to the same-named CLI command; command
  availability depends on the installed npm version.
- `gitea`: the supplied context plus `issues.list(query)`,
  `issues.update(issue, data)`, `issues.close(issue)`,
  `milestones.create(title)`, `milestones.close(milestone)`, and
  `releases.create(data)`. Each API helper accepts an optional final repository
  argument overriding the context repository.
- `ai`: OpenAI-compatible text generation via `setup(config)` and
  `generate(prompt)`; see above.
- `result`: initially `null`; assign `global.result` to set the `result` output.
  Promises assigned to it are awaited. Returning a value from inline code or
  exporting a default value from a module does not set the output.

Git and npm wrappers return command stdout. Git and npm must be available on the
runner's `PATH`. Execution errors fail the action.

Only run trusted scripts: they execute with the action process's filesystem,
environment, and credential access. Do not interpolate untrusted workflow data
directly into inline JavaScript.

## Development

```sh
npm ci
npm run build
```

The build bundles `src/index.js` into the root `index.js` used by `action.yml`.
Source checkouts must be built before use. The Gitea build workflow builds and
publishes a major-version tag such as `v1` containing the bundle.

The action declares `runs.using: node24`, and the build container is pinned to
`node:24`. Gitea `act_runner` v0.6.1 accepts this runtime declaration, but executes
the `node` available in the job environment. When using this action in other
workflows, ensure their job image or host provides Node.js 24.

## License

[MIT](LICENSE)
