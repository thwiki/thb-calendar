module.exports = {
  productionSourceMap: false,
  filenameHashing: false,
  configureWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      config.externals = {
        'vue': 'Vue'
      };
    }
  }
}