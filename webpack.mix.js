let mix = require('laravel-mix');
const path = require("path")
mix
    .browserSync({
        proxy: {
            target: 'http://localhost:2121/'
        },
        port: 2027,
    })
    .alias({
        '@': path.join(__dirname, 'resources')
    })
    .webpackConfig({
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: "ts-loader",
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: ["*", ".js", ".jsx", ".vue", ".ts", ".tsx"]
        }
    })
