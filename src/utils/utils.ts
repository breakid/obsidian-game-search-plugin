import {
  RAWGGame,
  RAWGGameFromSearch,
  RAWGGenre,
  RAWGPlatformDetailed,
  RAWGPublisher,
  RAWGDeveloper,
  RAWGMetacriticPlatform,
  RAWGTag,
  RAWGStore,
  RAWGStoreDetailed,
  releaseYearForRAWGGame,
} from '@models/rawg_game.model';

// == Format Syntax == //
export const NUMBER_REGEX = /^-?[0-9]*$/;
export const DATE_REGEX = /{{DATE(\+-?[0-9]+)?}}/;
export const DATE_REGEX_FORMATTED = /{{DATE:([^}\n\r+]*)(\+-?[0-9]+)?}}/;

export function replaceIllegalFileNameCharactersInString(text: string) {
  return text.replace(/[[\]\\/:?|^#]/g, '').replace(/\s+/g, ' ');
}

export function makeFileName(game: RAWGGame | RAWGGameFromSearch, fileNameFormat?: string) {
  let result;
  if (fileNameFormat) {
    result = replaceVariableSyntax(game, replaceDateInString(fileNameFormat));
  } else {
    result = !game.released ? game.name : `${game.name} (${releaseYearForRAWGGame(game)})`;
  }
  return replaceIllegalFileNameCharactersInString(result) + '.md';
}

export function changeSnakeCase(game: RAWGGame | RAWGGameFromSearch) {
  return Object.entries(game).reduce((acc, [key, value]) => {
    acc[camelToSnakeCase(key)] = value;
    return acc;
  }, {});
}

export function replaceVariableSyntax(game: RAWGGame | RAWGGameFromSearch, text: string): string {
  if (!text?.trim()) {
    return '';
  }

  if (game.genres) {
    game.genres.toString = function (this: RAWGGenre[]) {
      return this.map(g => g.name).join(', ');
    };
  }

  if (game.platforms) {
    game.platforms.toString = function (this: RAWGPlatformDetailed[]) {
      return this.map(p => p.platform.name).join(', ');
    };
  }

  if (game.tags) {
    game.tags.toString = function (this: RAWGTag[]) {
      return this.map(p => p.name).join(', ');
    };
  }

  if (game.stores) {
    game.stores.toString = function (this: RAWGStore[]) {
      return this.map(p => p.name).join(', ');
    };
  }

  const detailedGame = game as RAWGGame;
  if (detailedGame) {
    if (detailedGame.developers) {
      detailedGame.developers.toString = function (this: RAWGDeveloper[]) {
        return this.map(p => p.name).join(', ');
      };
    }
    if (detailedGame.publishers) {
      detailedGame.publishers.toString = function (this: RAWGPublisher[]) {
        return this.map(p => p.name).join(', ');
      };
    }
    if (detailedGame.metacritic_platforms) {
      detailedGame.metacritic_platforms.toString = function (this: RAWGMetacriticPlatform[]) {
        return this.map(p => p.platform.platform.name + ': ' + p.metascore).join(', ');
      };
    }
    if (detailedGame.stores) {
      game.stores.toString = function (this: RAWGStoreDetailed[]) {
        return this.map(p => p.store.name).join(', ');
      };
    }
  }

  const entries = Object.entries(game);

  return entries
    .reduce((result, [key, val = '']) => {
      return result.replace(
        new RegExp(`{{${key}}}`, 'ig'),
        typeof val === 'object' && val !== null && 'name' in val ? val.name : val,
      );
    }, text)
    .replace(/{{\w+}}/gi, '')
    .trim();
}

export function camelToSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter?.toLowerCase()}`);
}

export function getDate(input?: { format?: string; offset?: number }) {
  let duration;

  if (input?.offset !== null && input?.offset !== undefined && typeof input.offset === 'number') {
    duration = window.moment.duration(input.offset, 'days');
  }

  return input?.format
    ? window.moment().add(duration).format(input?.format)
    : window.moment().add(duration).format('YYYY-MM-DD');
}

export function replaceDateInString(input: string) {
  let output: string = input;

  while (DATE_REGEX.test(output)) {
    const dateMatch = DATE_REGEX.exec(output);
    let offset = 0;

    if (dateMatch?.[1]) {
      const offsetString = dateMatch[1].replace('+', '').trim();
      const offsetIsInt = NUMBER_REGEX.test(offsetString);
      if (offsetIsInt) offset = parseInt(offsetString);
    }
    output = replacer(output, DATE_REGEX, getDate({ offset }));
  }

  while (DATE_REGEX_FORMATTED.test(output)) {
    const dateMatch = DATE_REGEX_FORMATTED.exec(output);
    const format = dateMatch?.[1];
    let offset = 0;

    if (dateMatch?.[2]) {
      const offsetString = dateMatch[2].replace('+', '').trim();
      const offsetIsInt = NUMBER_REGEX.test(offsetString);
      if (offsetIsInt) offset = parseInt(offsetString);
    }

    output = replacer(output, DATE_REGEX_FORMATTED, getDate({ format, offset }));
  }

  return output;
}

function replacer(str: string, reg: RegExp, replaceValue) {
  return str.replace(reg, function () {
    return replaceValue;
  });
}

export function mapToString(m: Map<string, string>): string {
  if (!m || m.size <= 0 || !(m instanceof Map)) return '';
  let s = '';
  for (const [key, value] of m) {
    s += key + ': ' + value + '\n';
  }
  return s.trim();
}

export function stringToMap(s: string): Map<string, string> {
  const m = new Map<string, string>();
  if (!s) return m;
  const lines = s.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].contains(':')) {
      // Split on the first colon
      const components = lines[i].split(/:(.+)/);
      if (components[0] && components[1] && components[0].trim() && components[1].trim()) {
        m.set(components[0].trim(), components[1].trim());
      }
    }
  }
  return m;
}
