import prettier from 'prettier/standalone';
import * as prettierPluginEstree from 'prettier/plugins/estree';
import * as prettierPluginBabel from 'prettier/plugins/babel';
import * as prettierPluginHtml from 'prettier/plugins/html';
import * as prettierPluginPostcss from 'prettier/plugins/postcss';
import * as prettierPluginTypescript from 'prettier/plugins/typescript';

export const formatCode = async (code: string, language: string): Promise<string> => {
  let parser = '';
  const plugins = [
    prettierPluginEstree,
    prettierPluginBabel,
    prettierPluginHtml,
    prettierPluginPostcss,
    prettierPluginTypescript
  ];

  switch (language.toLowerCase()) {
    case 'javascript':
    case 'javascriptreact':
      parser = 'babel';
      break;
    case 'typescript':
    case 'typescriptreact':
      parser = 'typescript';
      break;
    case 'html':
      parser = 'html';
      break;
    case 'css':
    case 'scss':
    case 'less':
      parser = 'css';
      break;
    case 'json':
      parser = 'json';
      break;
    default:
      return code; // Unsupported language
  }

  try {
    return await prettier.format(code, {
      parser,
      plugins,
      singleQuote: true,
      semi: true,
      tabWidth: 2,
      printWidth: 100,
    });
  } catch (err) {
    console.error('Formatting error:', err);
    return code;
  }
};
