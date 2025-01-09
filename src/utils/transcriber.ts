// @ts-expect-error - replace_str will be added to the String prototype, doesn't matter if it doesn't exist already.
String.prototype.replace_str = function (
  target: string,
  replacement: string,
): string {
  const pattern = new RegExp(
    `\\b${target}\\b(?=(?:(?:[^"]*"){2})*[^"]*$)`,
    'g',
  );

  return this.replace(pattern, replacement);
};

/**
 * Transcribes the source code from RizzScript Extended to base RizzScript.
 * @param source The source code to transcribe.
 * @returns The transcribed source code.
 */
export function transcribe(source: string) {
  return (
    source
      // @ts-expect-error replace_str is assigned earlier in the code.
      .replace_str('ahh', ';')
      .replace_str('is', '=')
      .replace_str('bet', 'let')
      .replace_str('based', 'const')
      .replace_str('yap', 'println')
      .replace_str('sus', 'if')
      .replace_str('npc', 'null')
      .replace_str('goon', 'else')
      .replace_str('nah', '!=')
      .replace_str('fr', '==')
      .replace_str('btw', '&&')
      .replace_str('maybe', '|')
      .replace_str('rizz', 'fn')
      .replace_str('nerd', 'math')
      .replace_str('grind', 'for')
      .replace_str('smol', '<')
      .replace_str('thicc', '>')
      .replace_str('deadass', 'true')
      .replace_str('cap', 'false')
      .replace_str('fuck_around', 'try')
      .replace_str('find_out', 'catch')
      .replace_str('snoop', 'input')
      .replace_str('lose', '-')
      .replace_str('gain', '+')
      .replace_str('down', '--')
      .replace_str('up', '++')
      .replace_str('massive', '*')
      .replace_str('edge', '/')
      .replace_str('bye', 'exit')
      .replace_str('lag', 'setTimeout')
      .replace_str('yappachino', 'setInterval')
      .replace_str('stack', '+=')
      .replace_str('london', '-=')
      .replace_str('betimes', '*=')
      .replace_str('ratio', '/=')
      .replace_str('then', '->')
      .replace_str('lock in', 'import')
      .replace_str('glue', 'strcon')
  );
}
