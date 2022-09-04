import * as esbuild from "esbuild-wasm";

export const unpkgPathPlugin = () => {
    return {
        name: "unpkg-path-plugin",
        setup(build: esbuild.PluginBuild) {
            // Handle root entry file of 'index.js'
            build.onResolve({ filter: /(^index\.js$)/ }, () => {
                return {
                    path: "index.js",
                    namespace: "a",
                };
            });

            // Handle relative paths in a module
            build.onResolve({ filter: /^\.+\// }, (args: any) => {
                const { path, resolveDir } = args;
                const { href } = new URL(
                    path,
                    `https://unpkg.com${resolveDir}/`
                );

                return {
                    namespace: "a",
                    path: href,
                };
            });

            // Handle main file of a module
            build.onResolve({ filter: /.*/ }, async (args: any) => {
                const { path } = args;

                return {
                    namespace: "a",
                    path: `https://unpkg.com/${path}`,
                };
            });
        },
    };
};
