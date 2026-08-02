module.exports = {
    // ... your existing configuration
    resolve: {
      fallback: {
        "stream": require.resolve("stream-browserify"),
        "crypto": require.resolve("crypto-browserify"),
        "path": require.resolve("path-browserify"),
        "util": require.resolve("util/"),
        "os": require.resolve("os-browserify/browser"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "zlib": require.resolve("browserify-zlib"),
        "url": require.resolve("url"),
        "net": false,
        "tls": false,
        "child_process": false,
        "dns": false,
        "fs": false,
      }
    }
  }