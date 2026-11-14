import { getExecOutput } from "@actions/exec";

export default function () {
  return {
    log: async (...args) =>
      (await getExecOutput("git", ["log", ...args]))?.stdout,
    describe: async (...args) =>
      (await getExecOutput("git", ["describe", ...args]))?.stdout,
    diff: async (...args) =>
      (await getExecOutput("git", ["diff", ...args]))?.stdout,
    show: async (...args) =>
      (await getExecOutput("git", ["show", ...args]))?.stdout,
    revParse: async (...args) =>
      (await getExecOutput("git", ["rev-parse", ...args]))?.stdout,
    status: async (...args) =>
      (await getExecOutput("git", ["status", ...args]))?.stdout,
    commit: async (...args) =>
      (await getExecOutput("git", ["commit", ...args]))?.stdout,
    config: async (...args) =>
      (await getExecOutput("git", ["config", ...args]))?.stdout,
    push: async (...args) =>
      (await getExecOutput("git", ["push", ...args]))?.stdout,
    tag: async (...args) =>
      (await getExecOutput("git", ["tag", ...args]))?.stdout,
    clone: async (...args) =>
      (await getExecOutput("git", ["clone", ...args]))?.stdout,
    checkout: async (...args) =>
      (await getExecOutput("git", ["checkout", ...args]))?.stdout,
    fetch: async (...args) =>
      (await getExecOutput("git", ["fetch", ...args]))?.stdout,
    pull: async (...args) =>
      (await getExecOutput("git", ["pull", ...args]))?.stdout,
    merge: async (...args) =>
      (await getExecOutput("git", ["merge", ...args]))?.stdout,
    reset: async (...args) =>
      (await getExecOutput("git", ["reset", ...args]))?.stdout,
  };
}
