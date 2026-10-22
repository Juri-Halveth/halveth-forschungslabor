// SPDX-License-Identifier: MIT
//! Local, explicit-text CLI for the source-bound Script Lab library.

use lucinet_script_lab::{analyze, demo_cases};

fn help() -> &'static str {
    "Usage: lucinet-script-lab --demo | --text <text>\n\
     The command reads only its explicit text argument and writes JSON to stdout."
}

fn run(args: &[String]) -> Result<String, String> {
    match args {
        [flag] if flag == "--demo" => {
            let results: Vec<_> = demo_cases()
                .into_iter()
                .map(|(name, text)| {
                    serde_json::json!({
                        "name": name,
                        "analysis": analyze(text)
                    })
                })
                .collect();
            serde_json::to_string_pretty(&results).map_err(|error| error.to_string())
        }
        [flag, text] if flag == "--text" => {
            serde_json::to_string_pretty(&analyze(text)).map_err(|error| error.to_string())
        }
        [flag] if flag == "--help" || flag == "-h" => Ok(help().to_owned()),
        _ => Err(help().to_owned()),
    }
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match run(&args) {
        Ok(output) => println!("{output}"),
        Err(error) => {
            eprintln!("{error}");
            std::process::exit(2);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::run;

    #[test]
    fn explicit_text_preserves_source_and_layers() {
        let output = run(&["--text".to_owned(), "Å".to_owned()]).unwrap();
        let value: serde_json::Value = serde_json::from_str(&output).unwrap();
        assert_eq!(value["logical_text"], "Å");
        assert_eq!(value["utf8_hex"], "C3 85");
        assert_eq!(value["nfd"], "A\u{030A}");
    }

    #[test]
    fn no_implicit_input_or_file_access() {
        assert!(run(&[]).is_err());
        assert!(run(&["--file".to_owned(), "secret.txt".to_owned()]).is_err());
    }
}
