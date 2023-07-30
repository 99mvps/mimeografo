module.exports = (parser) => {
  return {
    babel: {
      parser: "babel",
    },
    "babel-flo": {
      parser: "babel",
    },
    "babel-t": {
      parser: "babel",
    },
    flow: {
      parser: "flow",
    },
    typescript: {
      parser: "typescript",
    },
    espree: {
      parser: "espree",
    },
    meriyah: {
      parser: "meriyah",
    },
    acorn: {
      parser: "acorn",
    },
    css: {
      parser: "css",
    },
    scss: {
      parser: "scss",
    },
    less: {
      parser: "less",
    },
    json: {
      parser: "json",
    },
    json5: {
      parser: "json5",
    },
    "json-stringif": {
      parser: "json",
    },
    graphql: {
      parser: "graphql",
    },
    markdown: {
      parser: "markdown",
    },
    mdx: {
      parser: "mdx",
    },
    html: {
      parser: "html",
    },
    vue: {
      parser: "vue",
    },
    angular: {
      parser: "angular",
    },
    lwc: {
      parser: "lwc",
    },
    yaml: {
      parser: "yaml",
    },
  }[parser];
};
