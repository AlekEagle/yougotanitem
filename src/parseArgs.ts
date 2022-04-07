const argv = process.argv;

export default function parseArgs() {
  let out: {
    command: string;
    args: string[];
    flags: { [key: string]: string };
  } = { command: argv[0], args: [], flags: {} };

  for (let i = 1; i < argv.length; i++) {
    if (argv[i].match(/^-[a-z0-9]$/)) {
      if (!argv[i + 1].match(/^-/)) {
        out.flags[argv[i].substring(1, 2)] = argv[++i];
      } else out.flags[argv[i].substring(1, 2)] = '';
    } else if (argv[i].match(/^-[a-z0-9]=?.+$/)) {
      out.flags[argv[i].substring(1, 2)] = argv[i].replace(
        /^-[a-z0-9]=?(.+)$/,
        '$1'
      );
    } else if (argv[i].match(/^--[a-z0-9]+$/)) {
      if (!argv[i + 1].match(/^-/)) {
        out.flags[argv[i].replace('--', '')] = argv[++i];
      } else out.flags[argv[i].replace('--', '')] = '';
    } else if (argv[i].match(/^--[a-z0-9]+=.+$/)) {
      out.flags[argv[i].substring(2, argv[i].indexOf('='))] = argv[i].replace(
        /^--[a-z0-9]+=(.+)$/,
        '$1'
      );
    } else out.args.push(argv[i]);
  }
  return out;
}
