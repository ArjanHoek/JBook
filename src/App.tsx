import * as esbuild from "esbuild-wasm";
import { useEffect, useRef, useState } from "react";
import { unpkgPathPlugin } from "./plugins/unpkg-path-plugin";
import { fetchPlugin } from "./plugins/fetch-plugin";

function App() {
    const [input, setInput] = useState("");
    const [code, setCode] = useState("");

    const ref = useRef<any>();

    const startService = async () => {
        const esbuildPath = "esbuild-wasm@0.8.27/esbuild.wasm";

        ref.current = await esbuild.startService({
            worker: true,
            wasmURL: `https://unpkg.com/${esbuildPath}`,
        });
    };

    useEffect(() => {
        startService();
    }, []);

    const onChange = (e: any) => {
        setInput(e.target.value);
    };

    const onClick = async () => {
        if (!ref.current) return;

        const result = await ref.current.build({
            entryPoints: ["index.js"],
            bundle: true,
            write: false,
            plugins: [unpkgPathPlugin(), fetchPlugin(input)],
            define: {
                "process.env.NODE_ENV": "'production'",
                global: "window",
            },
        });

        const code = result.outputFiles[0].text;

        setCode(code);
    };

    return (
        <div className="App">
            <textarea
                rows={15}
                cols={80}
                value={input}
                onChange={onChange}
            ></textarea>
            <div>
                <button onClick={onClick}>Submit</button>
            </div>
            <pre>{code}</pre>
        </div>
    );
}

export default App;
