import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localForage from "localforage";

const fileCache = localForage.createInstance({
    name: "filecache",
});

export const getCachedOrRequest = async (
    key: string,
    formatData: ((string: string) => string) | null = null
) => {
    const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(key);

    if (cachedResult) return cachedResult;

    let { data, request } = await axios.get(key);

    if (formatData) data = formatData(data);

    const resolveDir = new URL("./", request.responseURL).pathname;

    const result: esbuild.OnLoadResult = {
        loader: "jsx",
        contents: data,
        resolveDir,
    };

    const newItem = await fileCache.setItem(key, result);

    return newItem;
};

export const fetchPlugin = (inputCode: string) => {
    return {
        name: "fetch-plugin",
        setup(build: esbuild.PluginBuild) {
            build.onLoad({ filter: /(^index\.js$)/ }, () => ({
                loader: "jsx",
                contents: inputCode,
            }));

            build.onLoad({ filter: /.*/ }, async (args: any) => {
                console.log("I ran, but didn't do anything...");
                return null;
            });

            build.onLoad({ filter: /.css/ }, async (args: any) => {
                const formatData = (data: string) => {
                    const escaped = data
                        .replace(/\n/g, "")
                        .replace(/"/g, '\\"')
                        .replace(/'/g, "\\'");

                    return `
                      const style = document.createElement('style');
                      style.innerText = '${escaped}';
                      document.head.appendChild(style);
                    `;
                };

                return await getCachedOrRequest(args.path, formatData);
            });

            build.onLoad(
                { filter: /.*/ },
                async (args: any) => await getCachedOrRequest(args.path)
            );
        },
    };
};
