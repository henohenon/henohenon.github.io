use std::path::{Path};
use serde::{Deserialize, Serialize};
use anyhow::Result;
use serde_json::Value;

use strune::{Node, render, impl_maybe_dependents, impl_maybe_slug, load_nodes_from_markdown, fill_dependents};

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct MyOpts<T>
{
    #[serde(flatten)]
    pub base: T,
    #[serde(default)]
    pub slug: Option<String>,
    #[serde(default)]
    pub dependents: Option<Vec<String>>,
}

impl_maybe_slug!(MyOpts);
impl_maybe_dependents!(MyOpts);

fn main() -> Result<()> {
    let base_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("src");
    let nodes: Vec<Node<MyOpts<Value>>> = load_nodes_from_markdown(base_path.join("content.md"))?;

    let nodes = fill_dependents(nodes);

    println!("nodes: {}", nodes.len());


    // Determine config path based on environment
    let config_path = if std::env::var("HENOHENON_GITHUB_IO_ENV").ok().as_deref() == Some("dev") {
        base_path.join("config_development.yml")
    } else {
        base_path.join("config.yml")
    };
    println!("Using config path: {}", config_path.display());

    let dist_path = base_path.join("dist");
    let public_path = base_path.join("static");

    render(
        "templates/**/*.html",
        &dist_path,
        &public_path,
        &config_path,
        nodes.as_slice(),
    )
        .map_err(|e| {
            eprintln!("render error: {:?}", e);
            e
        })?;

    Ok(())
}