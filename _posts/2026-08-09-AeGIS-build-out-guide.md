---
layout: distill
title: AeGIS Build-Out-Guide
description: A guide of the AeGIS codebase with instruction on how to contribute.
tags: AeGIS
date: 2026-08-09
featured: true
giscus_comments: true
mermaid:
  enabled: true
  zoomable: true
code_diff: true
map: true
chart:
  chartjs: true
  echarts: true
  vega_lite: true
tikzjax: true
typograms: true

authors:
  - name: Dylan J Roy-Leo
    url: "https://djroyleo.github.io"
    affiliations:
      name: UMass

_styles: >
  .fake-img {
    background: #bbb;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 0px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 12px;
  }
  .fake-img p {
    font-family: monospace;
    color: white;
    text-align: left;
    margin: 12px 0;
    text-align: center;
    font-size: 16px;
  }
---
# AeGIS Build-Out Guide

This document is a complete set of instructions for building AeGIS out from its
current skeleton into a full GIS application — both **functionality** (catalog,
IO drivers, layer management, symbology, attribute tables, geoprocessing,
project persistence, rendering) and **GUI layout/design** (owning the entire
look of the app, and migrating from the current ArcGIS-Pro-imitation layout to
a unique "artboard" workspace).

It is written against the codebase as of commit `3ef338e` ("Restructured").
Code blocks in this document are **sketches** — they show shapes, names, and
placement, not final code. Everything must still be adapted to pass the
workspace lints (see §8).

---

## Table of contents

1. [Architecture today — what exists and the rules that bind it](#1-architecture-today)
2. [Where new code goes — the placement decision guide](#2-where-new-code-goes)
3. [Prerequisite refactor: application state and the command queue](#3-prerequisite-refactor)
4. [Functionality build-out](#4-functionality-build-out)
   - 4.1 [Catalog pane: the pseudo file-management system](#41-catalog-pane)
   - 4.2 [IO drivers: making files openable](#42-io-drivers)
   - 4.3 [Adding data to the map](#43-adding-data-to-the-map)
   - 4.4 [Contents panel: full layer management](#44-contents-panel)
   - 4.5 [Symbology pane](#45-symbology-pane)
   - 4.6 [Attribute table](#46-attribute-table)
   - 4.7 [Geoprocessing toolbox and background jobs](#47-geoprocessing)
   - 4.8 [Project save/load](#48-project-saveload)
   - 4.9 [Map navigation extras](#49-map-navigation-extras)
   - 4.10 [Rendering roadmap](#410-rendering-roadmap)
5. [GUI ownership](#5-gui-ownership)
   - 5.1 [Theming: full control of the look](#51-theming)
   - 5.2 [Custom widgets and window chrome](#52-custom-widgets)
   - 5.3 [The artboard workspace](#53-the-artboard-workspace)
   - 5.4 [Fixed chrome: menu bar and status bar](#54-fixed-chrome)
6. [Error surfacing: the toast system](#6-error-surfacing)
7. [New dependencies and where they go](#7-new-dependencies)
8. [Cross-cutting engineering rules](#8-cross-cutting-rules)
9. [Suggested build order](#9-suggested-build-order)

---

## 1. Architecture today

### 1.1 Crate dependency graph

```
                        ┌────────────────┐
                        │   aegis-app    │  ← binary; the ONLY crate that may
                        │ (eframe/egui)  │    depend on eframe/egui
                        └───┬──┬──┬──┬───┘
              ┌─────────────┘  │  │  └──────────────┐
              ▼                ▼  ▼                 ▼
      ┌──────────────┐   ┌───────────────┐   ┌──────────────┐
      │ aegis-render │──▶│ aegis-project │   │  aegis-io *  │
      │ (camera, f64 │   │ (Layer, Proj, │   │ (drivers,    │
      │  screen math)│   │  Symbology)   │   │  catalog)    │
      └──────┬───────┘   └───┬───────┬───┘   └───┬─────┬────┘
             │               │       │           │     │
             │        ┌──────┘       └────┐      │     │
             ▼        ▼                   ▼      ▼     │
      ┌────────────────────┐   ┌──────────────────┐    │
      │    aegis-vector    │   │   aegis-raster   │◀───┘
      │ (geo-types data)   │   │ (bands, geotx)   │
      └─────────┬──────────┘   └────────┬─────────┘
                │      ┌────────────────┘
                ▼      ▼
           ┌────────────────┐        ┌─────────────────────┐
           │   aegis-core   │        │ aegis-geoprocessing │──▶ vector/raster/core
           │ (Color, LayerId│        │ (tools + registry;  │
           │  Crs, Error)   │        │  nothing depends on │
           └────────────────┘        │  it yet except app*)│
                                     └─────────────────────┘

* aegis-io and aegis-geoprocessing are currently NOT dependencies of
  aegis-app. Wiring them in is part of this build-out (§4.1, §4.7).
```

### 1.2 The invariants (do not break these)

These rules are stated in the module docs and are the whole point of the
restructure. Every feature below is designed around them:

| # | Rule | Source |
|---|------|--------|
| 1 | Only `aegis-app` may depend on eframe/egui. Every other crate is pure data + logic. | `crates/aegis-app/src/main.rs` doc comment |
| 2 | `aegis-render` is toolkit-agnostic: may one day depend on wgpu, must never depend on egui. | `crates/aegis-render/src/lib.rs` |
| 3 | World coordinates are `f64` everywhere. The only f64→f32 narrowing point is `to_pos2` in `crates/aegis-app/src/render_egui/mod.rs`; widenings use `f64::from`. | render_egui + workspace lints |
| 4 | Data and presentation are split: `aegis-vector`/`aegis-raster` hold pure datasets; name/visibility/symbology live on `aegis-project::Layer`. IO drivers speak `Dataset`, never `Layer`. | `aegis-io/src/lib.rs`, `aegis-project/src/lib.rs` |
| 5 | No filesystem IO in GUI code. Directory walking, caching, and watching belong in `aegis_io::catalog`. | `aegis-io/src/catalog.rs` doc comment |
| 6 | GUI code references layers by `LayerId`, never by index or name. | `aegis-core/src/id.rs` |
| 7 | Which files are openable is decided by `DriverRegistry`, never by a panel. | `aegis-app/src/panels/catalog.rs` doc comment |
| 8 | Nothing outside `render_egui` knows how layers become pixels (the renderer-swap seam). | `render_egui/mod.rs` |
| 9 | Workspace-wide clippy: `pedantic` + `nursery` denied, plus the full no-panic set (`unwrap_used`, `expect_used`, `indexing_slicing`, `arithmetic_side_effects`, `as_conversions`, …). All new code must pass. | root `Cargo.toml` |

### 1.3 What each crate will own as the app grows

| Crate | Owns today | Will own |
|-------|-----------|----------|
| `aegis-core` | `Color`, `LineStyle`, `FillStyle`, `LayerId`, `Crs`, `AegisError` | More id types (`MapViewId`, `PanelId`), more error variants; still zero dependencies |
| `aegis-vector` | `VectorDataset`, `Feature`, `Schema`, geometry re-exports | Spatial indexing hooks, editing primitives |
| `aegis-raster` | `RasterDataset`, `Band`, `GeoTransform` | Overviews/pyramids, block IO, resampling |
| `aegis-io` | `DatasetDriver` trait, `DriverRegistry`, catalog *types* | **Directory listing + caching (§4.1.2), concrete drivers (§4.2), file watching** |
| `aegis-geoprocessing` | `GeoprocessingTool` trait, `ParamSpec`, `ToolRegistry` | **Concrete tools, background job runner (§4.7)** |
| `aegis-project` | `Layer`, `LayerSource`, `Symbology`, `Project` | **Selection state, undo history, save/load schema, multi-map documents** (its own doc comment says selection/undo/save belong here, *not* in the GUI) |
| `aegis-render` | `MapCamera`, screen types, `MapRenderer` trait | **`fit_rect` camera math (§4.9), polygon triangulation (§4.10), the wgpu pipeline** |
| `aegis-app` | Panels, input plumbing, egui painter | **All theming, the artboard workspace, dialogs, toasts; grows several modules but stays "presentation only"** |

---

## 2. Where new code goes

Use this decision list for every new piece of functionality. It follows
directly from the invariants:

1. **Does it mention `egui`, `eframe`, colors-on-screen, pixels, fonts,
   windows, or input events?** → `aegis-app`. No exceptions.
2. **Is it math that turns world coordinates into screen coordinates (or
   back), camera motion, culling, tessellation, or GPU work?** →
   `aegis-render` (all `f64`; no egui types — use `ScreenPoint`/`ScreenRect`).
3. **Does it read or write files, list directories, or know about file
   formats?** → `aegis-io`.
4. **Does it transform datasets into datasets?** → `aegis-geoprocessing`
   (as a `GeoprocessingTool` so the GUI dialog is auto-generated).
5. **Is it about what the user's document *is* (layers, order, visibility,
   symbology values, selection, undo)?** → `aegis-project`.
6. **Is it a raw data structure of spatial data?** → `aegis-vector` /
   `aegis-raster`.
7. **Is it a primitive every crate might need (id, color value, error
   variant)?** → `aegis-core`.

**Feature → crates-touched matrix** for everything in this guide:

| Feature | core | vector | raster | io | geoproc | project | render | app |
|---|---|---|---|---|---|---|---|---|
| Catalog file tree (§4.1) | | | | ● | | | | ● |
| Folder picker modal (§4.1.4) | | | | ● | | | | ● |
| GeoJSON driver (§4.2) | | | | ● | | | | |
| Add data to map (§4.3) | | | | ● | | ● | | ● |
| Contents interactions (§4.4) | | | | | | ● | ● | ● |
| Symbology pane (§4.5) | | | | | | ● | | ● |
| Attribute table (§4.6) | | ● | | | | ● | | ● |
| Toolbox + jobs (§4.7) | ● | | | | ● | ● | | ● |
| Project save/load (§4.8) | ● | ● | ● | | | ● | | ● |
| Zoom-to-extent (§4.9) | | | | | | | ● | ● |
| Polygon fill (§4.10) | | | | | | | ● | ● |
| Raster render (§4.10) | | | | | | | | ● |
| wgpu pipeline (§4.10) | | | | | | | ● | ● |
| Theming (§5.1) | | | | | | | | ● |
| Artboard (§5.3) | ● | | | | | | | ● |

The pattern to notice: **almost every feature is "logic in a lower crate +
thin egui skin in `aegis-app`"**. If a feature seems to need lots of code in
`aegis-app`, part of it probably belongs lower.

---

## 3. Prerequisite refactor

Do this **before** any feature work. The current `AegisApp` is two fields and
the panels are stateless functions; every feature below needs per-panel state
and a way for panels to affect the app without borrowing everything mutably at
once.

### 3.1 Grow `AegisApp` into structured state

In `crates/aegis-app/src/app.rs`:

```rust
pub struct AegisApp {
    // Document
    project: Project,

    // Services (built once at startup)
    drivers: std::sync::Arc<aegis_io::DriverRegistry>,
    tools: std::sync::Arc<aegis_geoprocessing::ToolRegistry>,

    // Per-view state
    map_views: Vec<MapViewState>,        // starts with one; artboard uses many
    catalog: CatalogState,               // §4.1
    workspace: WorkspaceState,           // §5.3 (artboard); trivial until then
    toasts: Toasts,                      // §6

    // Transient UI state
    commands: Vec<AppCommand>,           // §3.2
    dialogs: DialogState,                // open modal, if any (§4.1.4)
}

pub struct MapViewState {
    pub id: MapViewId,                   // new id type in aegis-core (§5.3.5)
    pub name: String,
    pub camera: MapCamera,
}
```

Registries are built in `main.rs` / `AegisApp::default()` and wrapped in
`Arc` because the geoprocessing job runner (§4.7) will need to share them
with worker threads.

### 3.2 The command queue

egui is immediate-mode: a context-menu click inside the catalog panel happens
while the panel borrows part of `self`. If that click must mutate `project`,
you either fight the borrow checker or you queue a command. **Queue a
command.** Define in a new `crates/aegis-app/src/command.rs`:

```rust
pub enum AppCommand {
    AddLayer(Layer),
    RemoveLayer(LayerId),
    SelectLayer(Option<LayerId>),
    ZoomTo { view: MapViewId, rect: geo_types::Rect<f64> },
    OpenDialog(Dialog),                  // e.g. Dialog::FolderPicker(picker)
    OpenPanel(PanelKind),                // §5.3
    Toast(ToastLevel, String),
    RunTool { tool_id: &'static str, args: ToolArgs },
    // ...grows with the app
}
```

Every panel `show`/`ui` function takes `&mut Vec<AppCommand>` (or a small
`CommandSink` newtype) and pushes into it instead of mutating distant state.
At the end of `AegisApp::ui`, drain and apply:

```rust
for cmd in std::mem::take(&mut self.commands) { self.apply(cmd); }
```

`apply` is the **single place** the project and app state are mutated in
response to UI. This one pattern makes the catalog (§4.1), context menus
(§4.4), tool dialogs (§4.7), and the artboard (§5.3) all straightforward.

(Exception: cheap, local mutations like the visibility checkbox in the
Contents panel may keep mutating `&mut Project` directly — don't dogmatize —
but anything that crosses panel boundaries goes through the queue.)

### 3.3 Split "panel content" from "panel container"

Today each file in `crates/aegis-app/src/panels/` both *docks itself* (calls
`egui::Panel::left(...)`) and *draws its content*. The artboard (§5.3) will
put the same content in floating windows instead. Prepare now, cheaply:

- Each panel module exposes `pub fn ui(ui: &mut egui::Ui, ...state...)` that
  draws **only the content** into whatever `Ui` it is given.
- The docking decision (`egui::Panel::right("right_panel")…`) moves up into
  `app.rs` (or later, into the workspace module).

`map_view::show` already has exactly this shape (it draws into
`ui.available_size()` wherever it's called) — mirror that for the others.
This refactor is ~30 minutes now and saves rewriting every panel later.

---

## 4. Functionality build-out

### 4.1 Catalog pane: the pseudo file-management system

Goal (restating the requirement precisely):

1. Remove the always-visible "Add folder connection" button.
2. Right-clicking the catalog pane's empty background opens a context menu
   with **Add folder connection**.
3. Choosing it opens a **centered modal folder browser** over the app.
4. Confirming a folder adds it as a root item in the catalog tree.
5. Each root is expandable: files are listed by name; subfolders are
   expandable items, recursively, lazily.

This feature splits cleanly across the io/app boundary:

```
aegis-io  (all filesystem logic)          aegis-app (all widgets)
─────────────────────────────────         ─────────────────────────────
FolderConnection      (exists)            CatalogState (connections,
CatalogEntry          (exists)              expanded-cache handle)
list_dir()            (new)               panels/catalog.rs (tree UI,
CatalogCache          (new)                 background context menu)
                                          dialogs/folder_picker.rs (new)
```

#### 4.1.1 `aegis-io`: directory listing

Add to `crates/aegis-io/src/catalog.rs`:

```rust
/// List one directory as catalog rows: folders first, then files,
/// each alphabetically (case-insensitive). Files are classified by the
/// registry: a file some driver claims becomes `CatalogEntry::Dataset`,
/// anything else `CatalogEntry::Unrecognized`.
///
/// # Errors
/// `AegisError::Io` if the directory cannot be read.
pub fn list_dir(
    path: &Path,
    registry: &DriverRegistry,
) -> Result<Vec<CatalogEntry>, AegisError> { ... }
```

Implementation notes:

- `std::fs::read_dir(path)?` — the `?` maps into `AegisError::Io` via the
  existing `From<std::io::Error>` impl. Per-entry errors (`entry?`): skip the
  entry (a vanished file mid-iteration is not fatal) — but do it without
  `unwrap`; a `filter_map` over `Result::ok` is fine and lint-clean.
- Classification: `entry.file_type()` for dir/file;
  `registry.driver_for(&path)` decides `Dataset { path, driver }` vs
  `Unrecognized` (rule 7 — the panel never looks at extensions).
- Sorting: sort by `(is_file, name.to_lowercase())`. Hidden files (leading
  `.`): skip by default; make it a parameter (`ListOptions { show_hidden }`)
  so the GUI can add a toggle later.
- **Multi-file formats**: shapefiles are `.shp` + `.dbf` + `.shx` + …; when a
  driver claims `.shp`, the sidecar files should ideally be hidden. Add an
  optional `fn sidecar_extensions(&self) -> &[&'static str] { &[] }` method
  to `DatasetDriver` and have `list_dir` suppress files whose extension is a
  sidecar of a claimed sibling. Defer this until the shapefile driver lands,
  but know it goes *here*, not in the panel.

#### 4.1.2 `aegis-io`: the cache

Walking the filesystem on every frame is out of the question (egui redraws at
input rate). Add a cache, also in `catalog.rs` (or a new `catalog/cache.rs`):

```rust
/// Memoized directory listings for the catalog tree.
#[derive(Default)]
pub struct CatalogCache {
    entries: HashMap<PathBuf, Result<Vec<CatalogEntry>, AegisError>>,
}

impl CatalogCache {
    /// The cached listing for `path`, computing it on first access.
    pub fn entries(&mut self, path: &Path, registry: &DriverRegistry)
        -> &Result<Vec<CatalogEntry>, AegisError> { ... }

    /// Drop the cached listing for `path` (and descendants), forcing a
    /// re-read on next access. Wire this to a "Refresh" context-menu item.
    pub fn invalidate(&mut self, path: &Path) { ... }

    pub fn clear(&mut self) { ... }
}
```

Caching the `Err` case matters: an unreadable directory must not retry every
frame. Storing `AegisError` directly is fine (it's not `Clone`; the getter
returns a reference). Future work that slots in here without touching the
panel: `notify`-based file watching that calls `invalidate` automatically.

#### 4.1.3 `aegis-app`: catalog state and the tree UI

New state (in `panels/catalog.rs` or a `state.rs`):

```rust
pub struct CatalogState {
    pub connections: Vec<aegis_io::FolderConnection>,
    pub cache: aegis_io::CatalogCache,
}
```

Rewrite `panels/catalog.rs::show` → `ui(ui, &mut CatalogState, &DriverRegistry,
&mut Vec<AppCommand>)`:

**(a) The background context menu.** Two-layer approach so it works both on
rows and on empty space:

- Draw the tree first (inside a `egui::ScrollArea::vertical()`).
- Then claim the *remaining* space for interaction and attach the menu:

```rust
let bg = ui.interact(
    ui.available_rect_before_wrap().union(/* or just */ ui.max_rect()),
    ui.id().with("catalog_bg"),
    egui::Sense::click(),
);
bg.context_menu(|ui| {
    if ui.button("Add folder connection").clicked() {
        commands.push(AppCommand::OpenDialog(Dialog::FolderPicker(
            FolderPicker::starting_at_home(),
        )));
        ui.close();
    }
    if ui.button("Refresh").clicked() { state.cache.clear(); ui.close(); }
});
```

Notes: `ui.max_rect()` after content = the whole panel including empty space;
using `interact` *after* drawing the tree keeps row-level interactions (added
in (c)) on top. Delete the old "Add folder connection" button entirely; the
`ui.label("Catalog")` header can stay or become a styled heading (§5.1).

**(b) The tree.** Recursive function; `egui::CollapsingHeader` gives you
expand/collapse with state kept by egui, keyed by id — **key it with the full
path** so two folders named `data` don't share state:

```rust
fn folder_ui(ui, path: &Path, state: &mut CatalogState,
             drivers: &DriverRegistry, commands: &mut Vec<AppCommand>) {
    let name = path.file_name().map_or_else(
        || path.display().to_string(),
        |n| n.to_string_lossy().into_owned());
    egui::CollapsingHeader::new(name)
        .id_salt(path)                 // ← disambiguates identical names
        .show(ui, |ui| {
            // Lazy: this closure only runs when expanded, so the cache is
            // only populated for folders the user actually opens.
            match state.cache.entries(path, drivers) {
                Ok(entries) => {
                    // NOTE: iterate a clone of the entry list (they're small)
                    // or collect child paths first — you cannot hold a borrow
                    // of `state.cache` while recursing with `&mut state`.
                    for entry in entries.clone() {
                        match entry {
                            CatalogEntry::Folder(p) =>
                                folder_ui(ui, &p, state, drivers, commands),
                            CatalogEntry::Dataset { path, driver } =>
                                dataset_row_ui(ui, &path, &driver, commands),
                            CatalogEntry::Unrecognized(p) =>
                                { ui.weak(file_name_of(&p)); }
                        }
                    }
                }
                Err(e) => { ui.colored_label(ui.visuals().error_fg_color,
                                             e.to_string()); }
            }
        });
}
```

Top level: one `folder_ui` per `state.connections` entry, but root rows
should display the **full path** and carry their own context menu with
**Remove connection** (pushes a command; removal also calls
`cache.invalidate`). The borrow dance flagged in the comment is real — the
clean solution is `let entries = state.cache.entries(...).clone()` for the
`Ok` arm (make `list_dir` results cheap: `CatalogEntry` is already
`Clone`).

**(c) Dataset rows** get `Sense::click()` labels with:
- a context menu: **Add to map** (§4.3), later *Properties*;
- `double_clicked()` → also Add to map (the GIS convention);
- the driver name shown as a subtle badge/weak text on the right
  (`ui.horizontal` + `ui.weak(driver)`), which doubles as debug feedback that
  the registry classification works.

`Unrecognized` files render `ui.weak(...)` (greyed out), matching the intent
in `CatalogEntry`'s doc. Optionally hide them behind a "Show all files"
toggle stored in `CatalogState`.

#### 4.1.4 The folder-picker modal

Build AeGIS's **own** egui folder browser rather than using the native OS
dialog (`rfd`). Rationale: (1) it keeps the look 100% AeGIS-owned, which is
the explicit direction of §5; (2) no new native dependencies; (3) the same
widget gets reused for `ParamKind::Path` in tool dialogs (§4.7) and for
project save/load (§4.8). If you want a stopgap first, `rfd::FileDialog`
(dependency in `aegis-app` only) works in one line — but treat it as
temporary. *(Note: `rfd`'s blocking `pick_folder` freezes the UI thread while
open; that's acceptable for a stopgap modal but is another reason the custom
picker wins.)*

New module `crates/aegis-app/src/dialogs/folder_picker.rs`:

```rust
pub struct FolderPicker {
    current: PathBuf,               // directory being viewed
    selection: Option<PathBuf>,     // single-clicked subfolder, if any
    error: Option<String>,          // last navigation error, shown inline
}

pub enum PickerResult { Open, Cancelled, Picked(PathBuf) }

impl FolderPicker {
    pub fn starting_at_home() -> Self { ... }   // std::env::home_dir()
    pub fn ui(&mut self, ctx: &egui::Context,
              cache: &mut CatalogCache, drivers: &DriverRegistry)
              -> PickerResult { ... }
}
```

Layout of the modal (use `egui::Modal` — it dims the background, centers
itself, and closes on outside-click/Escape; if its behavior doesn't fit,
fall back to `egui::Window` with `.pivot(Align2::CENTER_CENTER)`,
`.fixed_pos(ctx.screen_rect().center())`, `.collapsible(false)`,
`.resizable(true)` and `Order::Foreground`):

```
┌──────────────────────────────────────────────┐
│  Add folder connection                       │
│  ┌────────────────────────────────────────┐  │
│  │ ⌂ home ▸ djroyleo ▸ CODE ▸ gis-data    │  │ ← breadcrumb row: each
│  ├────────────────────────────────────────┤  │   segment is a button that
│  │  📁 boundaries                         │  │   jumps to that ancestor
│  │  📁 elevation          (single-click   │  │
│  │  📁 hydrology     ←     selects,       │  │ ← ScrollArea; folders only
│  │  📁 imagery             double-click   │  │   (files may show greyed
│  │                         descends)      │  │   for orientation)
│  ├────────────────────────────────────────┤  │
│  │ Selected: ~/CODE/gis-data/hydrology    │  │
│  │                     [Cancel] [Select]  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

Rules:

- All listing goes through `CatalogCache::entries` / `list_dir` (rule 5 — the
  picker does **zero** direct `std::fs` calls). Folders only ⇒ filter for
  `CatalogEntry::Folder`.
- Breadcrumbs come from `Path::ancestors()` (reversed); each is a button
  setting `self.current`.
- **Select** returns `Picked(selection.unwrap_or(current))` — i.e. with
  nothing highlighted, the button reads "Select current folder" and picks the
  directory being viewed. (Write it with `map_or`/`unwrap_or_else`, not
  `unwrap`.)
- Navigation into an unreadable directory sets `self.error` and stays put;
  show it as a red inline label, not a toast (the modal is focused context).
- Keyboard: Escape = cancel (`Modal` gives this for free), Enter = select.

Ownership/flow: `DialogState` in `AegisApp` holds
`Option<Dialog>`; `AegisApp::ui` calls the open dialog's `ui()` after the
panels; `Picked(path)` ⇒ push `FolderConnection::new(path)` into
`catalog.connections` (dedupe: skip if an identical or ancestor connection
exists — or allow duplicates and let the `id_salt(path)` keep the tree sane;
recommend dedupe-on-exact-match only). Persist connections across runs —
see §5.3.6, same mechanism as the workspace layout.

#### 4.1.5 Acceptance checklist for §4.1

- [ ] No button in the catalog pane; right-click anywhere in it (including
      below the tree) opens the menu.
- [ ] Picker opens centered, navigates the real filesystem, survives
      permission-denied directories without panicking (lints make panics
      impossible; the *behavior* must also be graceful).
- [ ] Added folder appears as a root; expanding is lazy; unreadable subfolder
      shows an inline error row; Refresh recovers after external changes.
- [ ] `cargo clippy --workspace --all-targets` is clean.

---

### 4.2 IO drivers

The catalog is only as useful as the registry behind it. Ship drivers in this
order (all in `aegis-io`, each a `driver/<format>.rs` module implementing
`DatasetDriver`, registered in a new `pub fn default_registry() -> DriverRegistry`
that `aegis-app` calls at startup):

1. **GeoJSON** (`geojson` crate, pure Rust). `can_open`: extension `geojson`/
   `json` (for `json`, sniff the first non-whitespace bytes for `{`, then
   parse lazily — or just claim `.geojson` only, simplest). `read`: the
   `geojson` crate converts to `geo_types::Geometry` directly (it has
   georust interop), properties map onto `AttributeValue`
   (Null/Bool/Number→Int-or-Float/String→Text); build the `Schema` by
   unioning the property keys of all features. CRS: GeoJSON is by spec
   WGS84 ⇒ `Crs::Epsg(4326)`. `write`: the reverse; refuse
   `Dataset::Raster` with `AegisError::InvalidData`.
2. **Shapefile** (`shapefile` crate). Brings the sidecar-suppression need
   (§4.1.1). DBF fields map cleanly onto `FieldKind`.
3. **GeoTIFF** (via `tiff`, or bite the GDAL bullet later) — first raster
   driver; unblocks raster rendering (§4.10.2).
4. **GeoPackage** (`rusqlite` + WKB parsing via `geozero`) — later; it's the
   modern default and worth doing well.

Testing: drivers are pure functions on paths — give each a `tests/` dir with
tiny fixture files. This is the most unit-testable corner of the codebase;
use it to establish the test conventions (§8.4).

### 4.3 Adding data to the map

The missing link between catalog and contents. Flow, entirely via commands:

1. Catalog row's **Add to map** / double-click pushes
   `AppCommand::AddLayerFromPath(path)`.
2. `AegisApp::apply`:
   - `self.drivers.read(&path)` → `Dataset` (errors → toast, §6).
   - Convert to a `Layer`: this is the caller's job by design (rule 4).
     Add a small helper in **`aegis-app`** (e.g. `layer_from_dataset(name,
     dataset)`) that matches `Dataset::Vector/Raster` onto `Layer::vector`/
     `Layer::raster` with **default symbology from a rotating palette**
     (deterministic sequence of pleasant colors — store a counter in
     `AegisApp`; the palette itself can live in the theme module §5.1.4).
     Name = file stem.
   - `self.project.add_layer(layer)` and optionally auto-zoom: push
     `ZoomTo` with the dataset's bounds (§4.9).
3. Reading large files will eventually block the UI; when that day comes,
   move the read onto the job runner (§4.7.3) — the command indirection means
   nothing else changes.

### 4.4 Contents panel

Current state: checkbox + name + dead context menu. Build-out, in order:

1. **Selection.** Per `aegis-project`'s own doc, selection state belongs in
   the project crate, not the GUI. Add to `Project`:
   `pub active_layer: Option<LayerId>` (and later
   `selected_features: HashMap<LayerId, Vec<usize>>` for feature selection).
   Clicking a layer name selects it (`AppCommand::SelectLayer`); paint the
   row highlighted (`ui.visuals().selection`). The symbology pane (§4.5) and
   attribute table (§4.6) both key off `active_layer`.
2. **Wire the context menu** to real commands:
   - *Open attribute table* → `OpenPanel(PanelKind::AttributeTable(id))`
   - *Symbology* → `SelectLayer(id)` + `OpenPanel(PanelKind::Symbology)`
   - *Zoom to layer* (new item) → `ZoomTo` with `layer.source.bounds()`
     (skip the item when bounds are `None`)
   - *Remove* (new item) → `RemoveLayer(id)`
   - *Rename* (new item) → sets `renaming: Option<LayerId>` in panel state;
     that row renders a `TextEdit` until Enter/focus-loss commits.
3. **Reordering.** Draw order = list order (bottom first), and the Contents
   panel should display **top-of-stack first** like every GIS, i.e. iterate
   `project.layers.iter().rev()` — do this flip in the panel only, never
   reorder the model for display. Implement drag-to-reorder with egui's
   drag-and-drop (`ui.dnd_drag_source` / `dnd_drop_zone`, id = `LayerId`);
   fallback (or v1): ▲/▼ buttons on the selected row pushing
   `AppCommand::MoveLayer { id, delta: isize }`. Reordering by id keeps rule
   6 intact.
4. **Per-kind icons** (point/line/polygon/raster glyph before the name) — a
   small symbology swatch drawn with `ui.painter()` (a 14×14 rect: fill +
   stroke from the layer's `VectorSymbology`) doubles as a legend and a
   click-target for the symbology pane. This is the first place the app's
   *own* visual identity shows up (§5).

### 4.5 Symbology pane

A new panel (`panels/symbology.rs`) editing the **active layer's**
`Symbology` in place (live preview — the map redraws every frame anyway).

- Resolve `project.active_layer` → `project.layer_mut(id)`; if `None`, show
  a hint ("Select a layer in Contents").
- `Symbology::Vector`: color pickers for `stroke.color` and `fill.color`,
  `DragValue`/`Slider` for `stroke.width` (0.1–10 px) and `point_radius`
  (1–20 px).
- `Symbology::Raster`: `opacity` slider 0.0–1.0.
- **Color conversion:** egui edits `egui::Color32`; the model stores
  `aegis_core::Color`. `render_egui/mod.rs` already has `to_color32`; add the
  inverse `from_color32` **next to it** (same module — it's the designated
  egui↔core conversion spot) and pattern:

  ```rust
  let mut c = to_color32(sym.stroke.color);
  if ui.color_edit_button_srgba(&mut c).changed() {
      sym.stroke.color = from_color32(c);
  }
  ```
- When categorized/graduated renderers arrive, they extend
  `aegis-project::symbology` (per its doc comment), and this pane grows a
  renderer-type dropdown. Design the pane as a `match` from day one.

### 4.6 Attribute table

New panel kind (`panels/attribute_table.rs`), opened per layer, showing
`VectorDataset.schema` as columns and `features` as rows.

- Use `egui_extras::TableBuilder` (new dep, §7) — it provides striped rows,
  resizable columns, and **row virtualization** (`body.rows(height, count,
  |row| ...)`), which matters the moment a real shapefile with 100k rows
  loads. Do not hand-roll with `Grid`.
- Cell text: match on `feature.attributes.get(&field.name)` →
  `AttributeValue` display; missing key renders as `NULL`-styled weak text.
  (`.get()`, never indexing — lint.)
- Column order comes from `Schema` (a `Vec`, so it's stable).
- Rows are addressed by index into `features` — acceptable *inside* one
  panel frame, but anything persistent (selection) should eventually use a
  feature id; note it as a TODO tied to the editing feature, don't build it
  yet.
- Clicking a row → feature selection (`Project.selected_features`) → §4.10's
  renderer draws selected features with a highlight color. This is the first
  cross-panel-to-map interaction; it exercises the whole
  command/project-state pipeline.

### 4.7 Geoprocessing toolbox and background jobs

#### 4.7.1 Tools (in `aegis-geoprocessing`)

Structure: `src/tools/vector/buffer.rs` etc., plus
`pub fn default_registry() -> ToolRegistry`. First tools, all backed by the
`geo` crate (already a dependency — never reimplement computational
geometry, per the crate doc):

| Tool id | geo backing | Params (ParamSpec) |
|---|---|---|
| `vector:buffer` | `geo::Buffer` | input: VectorInput; distance: Number |
| `vector:centroid` | `geo::Centroid` | input: VectorInput |
| `vector:convex_hull` | `geo::ConvexHull` | input: VectorInput |
| `vector:simplify` | `geo::Simplify` | input: VectorInput; tolerance: Number{min:0} |
| `vector:clip` / `union` / `difference` | `geo::BooleanOps` | two VectorInputs |

Each `run` validates `args` (missing/ill-typed → `InvalidParameter` — the
error type already exists for exactly this) and returns
`ToolOutput { datasets }`.

#### 4.7.2 The auto-generated tool dialog (in `aegis-app`)

New `panels/toolbox.rs` (a panel: search box filtering
`tools.iter()` by label, click → open dialog) and
`dialogs/tool_dialog.rs`:

```rust
pub struct ToolDialog {
    tool_id: &'static str,
    values: HashMap<&'static str, ParamValueDraft>,  // widget state per param
}
```

Widget per `ParamKind` — this mapping **is** the "zero GUI edits per tool"
promise, so keep it exhaustive and generic:

| ParamKind | Widget | Draft → ParamValue |
|---|---|---|
| `VectorInput` | ComboBox over `project.layers` filtered to `LayerSource::Vector`, storing `LayerId` | resolve id → **clone** the dataset at run time |
| `RasterInput` | same, filtered to raster | same |
| `Number{min,max}` | `DragValue` clamped to the bounds | `ParamValue::Number` |
| `Text` | `TextEdit::singleline` | `Text` |
| `Bool` | `Checkbox` | `Bool` |
| `Path` | read-only text + "…" button opening the folder/file picker (§4.1.4 — generalize the picker with a `PickTarget::{Folder, File}` mode) | `Path` |

"Run" validates required params client-side (disable the button + show which
are missing), builds `ToolArgs`, pushes `AppCommand::RunTool`.

Datasets are **cloned** into `ToolArgs` — that's the current design
(`ParamValue::Vector(VectorDataset)` holds owned data) and it's what makes
background execution trivially safe. When datasets get big enough to hurt,
change `ParamValue` to hold `Arc<VectorDataset>` — one crate, mechanical
change; don't pre-optimize now.

#### 4.7.3 The job runner (in `aegis-geoprocessing` — not the app)

The crate doc already reserves this: tools must never block the UI thread.

```rust
// aegis-geoprocessing/src/jobs.rs
pub struct JobRunner { /* mpsc channels, JoinHandles */ }
pub struct JobId(u64);
pub enum JobStatus { Running, Finished(Result<ToolOutput, AegisError>) }

impl JobRunner {
    pub fn submit(&mut self, registry: &Arc<ToolRegistry>,
                  tool_id: &str, args: ToolArgs) -> JobId { ... }
    /// Non-blocking; the GUI calls this once per frame.
    pub fn poll(&mut self) -> Vec<(JobId, JobLabel, Result<ToolOutput, AegisError>)> { ... }
}
```

- `std::thread::spawn` + `std::sync::mpsc` — no async runtime needed.
  `GeoprocessingTool` is `Send + Sync` and `ToolArgs` is owned data, so this
  compiles without drama. Move a clone of the `Arc<ToolRegistry>` into the
  thread.
- `AegisApp` owns a `JobRunner`, calls `poll()` at the top of `ui`, and for
  each finished job converts output datasets → layers (same palette helper
  as §4.3), toast on error. While jobs run, show a spinner row in a status
  bar (§5.4) or the toolbox panel.
- If a job is running, `ctx.request_repaint_after(Duration::from_millis(100))`
  so results appear promptly even when the user isn't moving the mouse.
- Progress reporting: later, extend `submit` to hand the tool a
  `ProgressSink` (a channel-backed callback param on a new optional trait
  method `run_with_progress`). Design decision recorded here so `run`'s
  signature doesn't churn twice.

### 4.8 Project save/load

Give every data crate an **optional, feature-gated** serde dependency so the
core stays pure by default:

```toml
# workspace deps
serde = { version = "1", features = ["derive"] }
ron   = "0.11"          # or serde_json; RON is friendlier to hand-inspection

# in each data crate's Cargo.toml
[features]
serde = ["dep:serde", "geo-types/serde"]      # geo-types has serde support
```

Derive `Serialize/Deserialize` (behind `#[cfg_attr(feature = "serde", ...)]`)
on: `Color`, `LineStyle`, `FillStyle`, `Crs` (core); dataset types (vector,
raster); `Layer`, `LayerSource`, `Symbology`, `Project` (project).

Two deliberate wrinkles:

1. **`LayerId` must not round-trip.** It's process-unique
   (`AtomicU64`); persisting raw ids would collide on the next run. Skip the
   field (`#[serde(skip, default = "LayerId::next")]`-style) so loading
   allocates fresh ids. Anything that referenced old ids is gone after a load
   anyway (fresh app state).
2. **Path-based vs embedded layers.** Real GIS projects store *references*
   to data files, not copies. Add provenance to `Layer`:
   `pub source_path: Option<PathBuf>` (set by §4.3 when a layer comes from a
   file; `None` for in-memory/tool outputs). Save writes the path for
   file-backed layers and embeds the dataset otherwise. On load, re-read
   file-backed layers through the `DriverRegistry`. **Keep the crate
   boundary:** `aegis-project` defines the serializable schema and can
   save/load the embedded case; the re-reading of paths is orchestrated in
   `aegis-app` (which already owns both the project and the registry). Do
   *not* make `aegis-io` depend on `aegis-project` — drivers speak datasets
   (rule 4), and project-file orchestration is app-level composition.
   Missing files at load → layer kept as a "broken link" entry (name +
   path, no source) with a toast, mirroring how ArcGIS/QGIS mark red-!
   layers. This requires `LayerSource::Broken { path: PathBuf }` — a variant
   addition exactly as the `LayerSource` doc prescribes (renderer arm =
   draw nothing).
3. File format: `.aegis` extension, RON or JSON body, top-level struct
   `ProjectFile { version: u32, project: Project }` — version it from day
   one.

Menu wiring (§5.4): File ▸ New / Open… / Save / Save As… — Open/Save use the
picker (§4.1.4) in file mode. Track `dirty: bool` (set in `apply`) and the
current path in `AegisApp`; confirm-on-close comes later.

### 4.9 Map navigation extras

1. **`MapCamera::fit_rect`** — in `aegis-render/src/camera.rs` (pure f64
   math, unit-test it there):

   ```rust
   /// Center on `rect` and zoom so it fits inside `viewport` with
   /// `padding` (a fraction, e.g. 0.05) of margin on each side.
   /// Degenerate rects (a single point) only re-center.
   pub fn fit_rect(&mut self, rect: &Rect<f64>, viewport: &ScreenRect,
                   padding: f64) { ... }
   ```

   `pixels_per_unit = min(vw / rw, vh / rh) * (1.0 - padding)`, clamped to
   `MIN_ZOOM..=MAX_ZOOM`; guard `rw`/`rh` of 0 (point layers!) by only
   setting `center`. This unlocks: Zoom to layer (§4.4), zoom to selection,
   View ▸ Zoom to full extent (`project.bounds()` already exists for exactly
   this), and auto-zoom on first added layer (§4.3).
2. **Status bar readout** (§5.4): the map view already knows
   `response.hover_pos()`; convert with `camera.screen_to_world` and push the
   coordinate up (return a small `MapViewOutput { hover_world: Option<Coord> }`
   from `map_view::show` rather than writing to globals).
3. **Tool modes.** Panning/zooming is currently unconditional. Introduce
   `enum MapTool { Pan, Identify, Measure, /* later: Edit */ }` in app state
   with a small toolbar strip; `map_view::show` matches on it: `Identify`
   consumes clicks → hit-test features (hit-testing math = world-space
   point-in-polygon/distance-to-line via `geo`; put the helper in
   `aegis-render` or a query module in `aegis-vector` — it takes camera +
   tolerance-in-pixels, so `aegis-render` is the better home) → select
   feature + open a popup of its attributes.

### 4.10 Rendering roadmap

Keep rule 8 sacred: all of this happens behind `render_egui::paint` (CPU) or
`MapRenderer` (GPU); panels never change.

#### 4.10.1 Polygon fills (near-term, CPU)

The lake polygon is outline-only because egui fills only convex polygons
(`vector.rs` comment). Fix:

- Triangulation lives in **`aegis-render`** (toolkit-free geometry):
  `pub fn triangulate(polygon: &Polygon<f64>) -> Vec<[Coord<f64>; 3]>` (or
  indices + vertices) using the `earcutr` crate — it handles holes.
- `render_egui/vector.rs::paint_polygon` builds an `egui::Mesh` from the
  triangles (`to_pos2` at the boundary, `to_color32(symbology.fill.color)`),
  then strokes the rings as today. Skip the mesh when
  `fill.color.a == 0`.
- Re-triangulating every frame will be fine for dev data and wrong for real
  data. When it hurts, add a cache keyed by `(LayerId, feature index)`
  invalidated on data change — which needs a `generation: u64` counter on
  `VectorDataset` bumped by any mutation. Note this now, build it when
  needed; the cache lives in `aegis-app` beside the texture cache below.

#### 4.10.2 Raster rendering (CPU, after the first raster driver)

`render_egui/raster.rs` is a stub with the seam ready. Implementation:

- Convert bands → `egui::ColorImage` (single band: grayscale or colormap
  through a stretch min/max; three bands: RGB), honoring `nodata` as
  transparent. Band-selection/stretch parameters belong on
  `RasterSymbology` (extend it in `aegis-project` — its doc lists exactly
  this as future work).
- Upload once via `ctx.load_texture`, hold `TextureHandle`s in a
  `TextureCache` (new struct in `render_egui/`, owned by `AegisApp`, passed
  into `paint` — `paint`'s signature grows a `&mut RenderCaches` parameter;
  this is expected and stays inside the seam).
- Draw with `painter.image(...)` mapping `dataset.bounds()` corners through
  `camera.world_to_screen` (+ `to_pos2`); tint alpha by `opacity`.
- Rebuild the texture only when symbology or data changes (generation
  counter again), never per frame.

#### 4.10.3 The wgpu pipeline (the real renderer)

When datasets outgrow the CPU path (typically: first real shapefile with
>100k features), build the pipeline **in `aegis-render`** exactly as its doc
comment plans:

1. Enable eframe's `wgpu` feature (workspace `Cargo.toml`:
   `eframe = { version = "0.35", features = ["wgpu"] }`) and add
   `egui_wgpu` to `aegis-app`; add `wgpu` to `aegis-render`.
2. In `aegis-render`, implement `MapRenderer` (the trait is already there):
   `prepare` tessellates layers into per-layer vertex/index buffers
   (reusing §4.10.1's triangulation; lines become quad strips with width in
   a shader), `render` sets the camera as a uniform (a 3×3/4×4 matrix built
   from `MapCamera` — add `MapCamera::to_matrix(viewport)`) and draws.
   f64→f32 for the GPU happens *here*: subtract a tile/layer origin first so
   f32 precision holds (the standard RTC — relative-to-center — trick); this
   becomes the second sanctioned narrowing point, documented like `to_pos2`.
3. In `aegis-app`, `render_egui` shrinks to an `egui_wgpu::Callback` adapter
   that hands the `MapRenderer` the viewport — panels and `map_view` don't
   change at all (rule 8 pays off here).
4. Then: R-tree culling and hit-testing (`rstar` crate, index stored beside
   the dataset), raster tiles as textures, feature-selection highlighting as
   a per-vertex flag or second draw pass.

Don't start here. The CPU path with culling (already implemented) will carry
development for a long time, and every earlier section works identically on
both paths.

---

## 5. GUI ownership

### 5.1 Theming: full control of the look

Everything egui draws is controlled by `egui::Style` (spacing, interaction)
and `egui::Visuals` (colors, strokes, rounding, shadows, fonts via
`FontDefinitions`). Owning these completely is how AeGIS stops looking like
"default egui" — before any layout changes.

#### 5.1.1 Create `crates/aegis-app/src/theme.rs`

One module, one entry point, called **once** at startup — which requires
using the `CreationContext` currently ignored in `main.rs`
(`Box::new(|_cc| ...)` → `Box::new(|cc| { theme::apply(&cc.egui_ctx); ... })`):

```rust
pub fn apply(ctx: &egui::Context) {
    ctx.set_fonts(font_definitions());
    ctx.set_style(style());          // or set per-theme, see below
}
```

Define the palette as named constants so every hard-coded color in the app
dies (`egui::Color32::WHITE` in `app.rs`'s map background is the first
casualty — replace with `theme::MAP_BACKGROUND` or, better, a
per-map-view setting later):

```rust
pub mod palette {
    use eframe::egui::Color32;
    pub const BG_CANVAS: Color32 = ...;   // artboard background
    pub const BG_PANEL: Color32 = ...;
    pub const ACCENT: Color32 = ...;      // the one AeGIS brand color
    pub const TEXT_PRIMARY: Color32 = ...;
    pub const TEXT_WEAK: Color32 = ...;
    // ...
}
```

#### 5.1.2 What to set (the complete checklist)

Work through `egui::Visuals` field by field — every one left default is a
place the app still looks like egui:

- `visuals.widgets.{noninteractive, inactive, hovered, active, open}`: each a
  `WidgetVisuals` with `bg_fill`, `weak_bg_fill`, `bg_stroke`, `fg_stroke`,
  `corner_radius`, `expansion`. This quintet *is* the look of every button,
  header, and slider. Decide hover/active behavior once (e.g. hover =
  accent-tinted stroke, active = filled accent) and the whole app follows.
- `visuals.selection` (used by text selection *and* selected rows — your
  Contents selection in §4.4 inherits this).
- `visuals.window_fill`, `window_stroke`, `window_shadow`,
  `window_corner_radius` — these style `egui::Window`, i.e. **the artboard
  panels** (§5.3). A distinctive shadow + radius here does more for a unique
  identity than anything else.
- `visuals.panel_fill` (docked panels), `extreme_bg_color` (text edits,
  scroll areas), `faint_bg_color` (striped table rows — §4.6),
  `hyperlink_color`, `error_fg_color`/`warn_fg_color` (§6 toasts and catalog
  error rows).
- `style.spacing`: `item_spacing`, `button_padding`, `indent` (tree depth in
  the catalog!), `interact_size`, `scroll` (bar width/rounding).
- `style.interaction`: `resize_grab_radius_side/corner` — matters a lot for
  floating panels.
- Light/dark: egui has per-theme styles (`ctx.set_style_of(egui::Theme::Dark,
  ...)` and a `ThemePreference`). Define *both* AeGIS light and AeGIS dark
  from the same palette module, wire a toggle into View (§5.4). Check exact
  API names against egui 0.35 docs — this area changed across recent
  versions.

#### 5.1.3 Fonts

Typography is half the identity. Bundle fonts (license-permitting — e.g.
Inter for UI + JetBrains Mono for coordinates/attribute values):

```rust
fn font_definitions() -> egui::FontDefinitions {
    let mut fonts = egui::FontDefinitions::default();
    fonts.font_data.insert("inter".into(),
        egui::FontData::from_static(include_bytes!("../assets/Inter-Regular.ttf")).into());
    // prepend to the Proportional family so it wins, keep egui's fallbacks
    // for glyph coverage; repeat for Monospace.
    ...
}
```

Then map `TextStyle`s (`style.text_styles`): pick a deliberate scale
(e.g. Small 11, Body 13, Button 13, Heading 17) instead of egui's defaults.
Panel titles in the artboard can use a custom `FontId` directly.

#### 5.1.4 The symbology palette

The rotating default-layer-color palette (§4.3) also lives in `theme.rs`,
but expressed as `aegis_core::Color` (it flows into the model, not the
chrome). Keep chrome palette (`Color32`) and data palette
(`aegis_core::Color`) as two separate lists — they serve different masters
(UI consistency vs. cartographic distinguishability).

### 5.2 Custom widgets and window chrome

Two escalation levels beyond Style/Visuals, use as needed:

1. **Custom widgets** — for anything egui's stock widgets can't express
   (the layer swatch in §4.4, a compass/scale indicator on the map, panel
   tab handles in §5.3). Pattern: `ui.allocate_exact_size(size, sense)` →
   inspect `response` → draw with `ui.painter()` using palette constants.
   Put shared ones in `crates/aegis-app/src/widgets/`.
2. **Owning the OS window frame** — the final step of "complete control":
   `NativeOptions { viewport: ViewportBuilder::default().with_decorations(false), .. }`
   removes the native title bar; AeGIS then draws its own top bar (menu +
   window title + min/max/close buttons) and implements dragging via
   `ui.interact(...)` + `ViewportCommand::StartDrag`, maximize/close via
   `ViewportCommand::Maximized`/`Close`. Do this **only after** the theme
   and artboard are in place — undecorated windows must also handle
   edge-resize (`ViewportCommand::BeginResize`) and it's fiddly; it's polish,
   not foundation.

### 5.3 The artboard workspace

The target: panels (Contents, Catalog, Symbology, Toolbox, Attribute tables,
**and the map views themselves**) are floating, movable, collapsible,
resizable cards on a large canvas. Fixed chrome: the top menu bar (and
status bar, §5.4).

```
┌──────────────────────────────────────────────────────────────────────┐
│ File  Edit  View                                    (fixed menu bar) │
├──────────────────────────────────────────────────────────────────────┤
│ · · · · · · · · · · · · · · (artboard canvas) · · · · · · · · · · · ·│
│ ·  ┌─ Contents ────── ▾ ─┐        ┌─ Map: Main ───────────── ▾ ─┐  · │
│ ·  │ ☑ Stations           │        │                              │ ·│
│ ·  │ ☑ River              │        │        (map renders          │ ·│
│ ·  │ ☑ Lake               │        │         here, §4.10)         │ ·│
│ ·  └───────────────────── ┘        │                              │ ·│
│ ·                                  └──────────────────────────────┘ ·│
│ ·  ┌─ Catalog ──────── ▾ ─┐              ┌─ Map: Inset ──── ▾ ─┐   · │
│ ·  │ ▸ ~/CODE/gis-data     │              │   (second map,       │  ·│
│ ·  │ ▸ ~/fieldwork         │              │    own camera)       │  ·│
│ ·  └───────────────────────┘              └──────────────────────┘  ·│
│ · · · right-click canvas: "Add panel ▸", "Reset layout" · · · · · · ·│
├──────────────────────────────────────────────────────────────────────┤
│ 512334.21, 4281002.77   EPSG:—    2 jobs ⟳        (fixed status bar) │
└──────────────────────────────────────────────────────────────────────┘
```

#### 5.3.1 Strategy: `egui::Window` first, custom chrome second

`egui::Window` **is** a floating, draggable, collapsible, resizable panel —
exactly the artboard card, with z-order/click-to-front handled by egui's
`Area` system for free. So the migration is:

- **Stage 1 (functional artboard):** every panel content function (§3.3)
  rendered inside an `egui::Window`, heavily restyled via §5.1's
  `window_*` visuals. You get move/collapse/resize/z-order/persistence
  hooks immediately, and ship a working artboard in days.
- **Stage 2 (unique chrome):** replace `egui::Window` with your own
  container built on `egui::Area` (which supplies positioning/dragging/
  z-order) + hand-drawn title bar, collapse animation
  (`ctx.animate_bool`), and resize handles. Do this only if Stage 1's
  restyled windows still don't feel "AeGIS enough" — you may be surprised
  how far `window_fill`/`shadow`/`corner_radius`/custom title-bar-text get
  you. The workspace model below is identical either way, so nothing is
  wasted.

#### 5.3.2 The workspace model (in `aegis-app`, new `workspace.rs`)

```rust
pub enum PanelKind {                      // every floatable thing
    Contents,
    Catalog,
    Symbology,
    Toolbox,
    AttributeTable(LayerId),
    Map(MapViewId),
}

pub struct PanelState {
    pub kind: PanelKind,
    pub open: bool,                       // closed ≠ removed: View menu reopens
    // position/size/collapsed are owned by egui's Area memory in Stage 1;
    // mirror them here only when you need save/restore (§5.3.6) or
    // programmatic layout ("Reset layout").
}

pub struct WorkspaceState {
    pub panels: Vec<PanelState>,
}
```

Rendering, in `AegisApp::ui` after the fixed chrome:

```rust
egui::CentralPanel::default()
    .frame(egui::Frame::new().fill(theme::palette::BG_CANVAS))
    .show(ui, |ui| {
        paint_canvas_background(ui);            // §5.3.4
        canvas_context_menu(ui, &mut commands); // "Add panel ▸ ..."
        for panel in &mut self.workspace.panels {
            show_floating_panel(ui.ctx(), panel, /* state each kind needs */);
        }
    });
```

`show_floating_panel` matches `PanelKind` and calls the §3.3 content
functions:

```rust
egui::Window::new(title_of(&panel.kind))
    .id(egui::Id::new(&panel.kind))     // PanelKind: Hash — stable identity
    .open(&mut panel.open)              // gives the ✕ button
    .default_size(default_size_of(&panel.kind))
    .constrain_to(canvas_rect)          // panels can't escape the artboard
    .show(ctx, |ui| match &panel.kind {
        PanelKind::Contents  => panels::contents::ui(ui, project, commands),
        PanelKind::Catalog   => panels::catalog::ui(ui, catalog, drivers, commands),
        PanelKind::Map(id)   => { /* §5.3.5 */ }
        ...
    });
```

Duplicates policy: most kinds are singletons (adding "Contents" twice is
confusing) — `AppCommand::OpenPanel` should focus/reopen an existing panel of
the same kind instead of pushing a second. Exceptions: `AttributeTable(id)`
(one per layer) and `Map(id)` (many by design).

#### 5.3.3 Borrow-checker note (learned the hard way if ignored)

The loop above borrows `self.workspace.panels` mutably while each panel body
needs `&mut self.project`, `&mut self.catalog`, etc. Structure `AegisApp` so
these are **sibling fields** (they already are, per §3.1) and destructure
once at the top of `ui`:

```rust
let Self { project, catalog, workspace, drivers, commands, .. } = self;
```

Then the loop borrows `workspace` while panel bodies borrow the siblings —
no conflict. This is precisely why panel content functions must take their
dependencies as parameters (§3.3) instead of `&mut AegisApp`.

#### 5.3.4 The canvas itself

- Background: flat `BG_CANVAS`, plus an optional subtle dot-grid painted
  with `ui.painter()` (dots every N px, one `circle_filled` per visible grid
  point, or a faint line grid) — this is the single cheapest "this is an
  artboard, not a dialog" signal.
- Canvas context menu (same `ui.interact` technique as §4.1.3a):
  **Add panel ▸** (submenu per `PanelKind`), **Reset layout** (clears egui's
  Area memory for the panel ids — repositions to defaults), later
  **Save/Load layout**.
- **Optional, later:** panning/zooming the artboard itself (infinite
  canvas). Skip it for v1 — it forces you to reimplement window dragging in
  canvas-space and confuses map-zoom vs board-zoom. Add only if real usage
  wants more panels than fit on screen; `constrain_to` + scroll is the
  simpler v1 answer.

#### 5.3.5 Maps as panels (the plural is the point)

This is the deepest consequence of the artboard and the reason for the §3.1
refactor:

- Add `MapViewId` to `aegis-core/src/id.rs` — a second newtype identical in
  shape to `LayerId` (own `AtomicU64`; consider extracting a
  small macro or just copy the 10 lines).
- `AegisApp.map_views: Vec<MapViewState>` — **camera is per-view**;
  `map_view::show(ui, project, &mut view.camera)` already has the right
  signature and needs no changes to render inside a window. Two maps = two
  cameras over the same project; panning one doesn't move the other. (Linked
  navigation — a "sync views" toggle copying camera state — is a trivial
  later feature *because* cameras are separate values.)
- The current `CentralPanel`-hosted single map is just the pre-artboard
  special case: `Map(main_view_id)` as the only, maximized panel. During the
  transition, keep the app working by making the artboard a `View ▸ Artboard
  workspace` toggle: `false` = today's docked layout, `true` = floating.
  Delete the docked path once the artboard is solid.
- For now all maps show the whole project. "Which layers appear in which
  map" is a *document* question → when wanted, restructure
  `aegis-project::Project` into `maps: Vec<MapDocument>` where each
  `MapDocument` owns a layer stack (or layer-id list into a shared pool).
  That is a real model change touching Contents/attribute-table targeting —
  schedule it consciously; don't back into it.
- Rendering cost: N maps = N × `render_egui::paint`. Fine on the CPU path
  for dev data; one more reason the wgpu path (§4.10.3) exists.

#### 5.3.6 Layout persistence

Users will arrange their artboard and expect it back on relaunch.

- Enable eframe persistence: `eframe = { ..., features = ["persistence"] }`
  and serde-derive the small app-state structs (`WorkspaceState`,
  `PanelState`, `PanelKind`, catalog connections as `Vec<PathBuf>`). egui
  already persists its own window positions/collapse state through eframe's
  storage automatically once persistence is on — Stage 1 gets position
  memory nearly free.
- Implement `eframe::App::save` (`set_value(eframe::APP_KEY, &snapshot)`)
  with a `WorkspaceSnapshot { workspace, folder_connections, theme_pref }`,
  and restore it in the `AegisApp` constructor from `cc.storage`. (The
  constructor change is the same `CreationContext` touch as §5.1.1 — do them
  together.)
- Note the id-stability requirement: `PanelKind::AttributeTable(LayerId)` and
  `Map(MapViewId)` contain process-unique ids that do **not** survive a
  restart (§4.8 wrinkle 1). Persist only id-free panels (or re-map ids on
  restore); simplest: on restore, drop attribute-table panels and re-create
  map panels fresh with new ids in saved positions... which requires saving
  positions yourself (mirror `Rect` into `PanelState` on save via
  `ctx.memory` area queries, or accept default positions for maps in v1).
  v1 recommendation: persist singleton panels + connections + theme; let
  maps/tables re-open manually.

### 5.4 Fixed chrome: menu bar and status bar

**Menu bar** (`panels/menu_bar.rs`) — replace the three dead buttons with
real dropdowns (`egui::MenuBar` / `ui.menu_button`), everything emitting
commands:

- **File:** New project, Open…, Save, Save As… (§4.8); Add data… (opens the
  picker in file mode → §4.3); Quit
  (`ctx.send_viewport_cmd(egui::ViewportCommand::Close)`).
- **Edit:** Undo/Redo — greyed placeholders until undo lands. (Undo design,
  for when it comes: command-pattern `ProjectEdit` enum with apply/revert in
  `aegis-project` — the project doc already claims undo history; the
  `AppCommand` queue from §3.2 is the natural capture point.)
- **View:** one checkbox per `PanelKind` toggling `PanelState::open`;
  Zoom to full extent (§4.9); Theme ▸ Light/Dark/System (§5.1.2);
  Artboard workspace toggle (§5.3.5, transitional).

**Status bar** — new `panels/status_bar.rs`, `egui::Panel::bottom` before
the central panel, fixed like the menu bar. Contents: cursor world
coordinates from the hovered map view (§4.9.2), map CRS label
(`Crs::Unknown` renders as "—" for now), running-job spinner + count
(§4.7.3), transient one-line messages (the quiet sibling of toasts).

---

## 6. Error surfacing: the toast system

The lint wall (no `unwrap`/`expect`/`panic`) means **every** `Result` needs a
place to go. That place must exist *before* the catalog/driver work starts,
or errors will get `let _ =`-swallowed under deadline pressure.

New `crates/aegis-app/src/toasts.rs`:

```rust
pub enum ToastLevel { Info, Warn, Error }
pub struct Toast { level: ToastLevel, text: String, created: Instant }
#[derive(Default)]
pub struct Toasts { queue: Vec<Toast> }

impl Toasts {
    pub fn push(&mut self, level: ToastLevel, text: impl Into<String>) { ... }
    /// Draw as a stack of small cards, top-right, above everything
    /// (egui::Area, Order::Foreground, anchored RIGHT_TOP). Expire after
    /// ~6s (Error: sticky until clicked). Palette colors from §5.1.
    pub fn ui(&mut self, ctx: &egui::Context) { ... }
}
```

`AppCommand::Toast` feeds it; `AegisApp::apply`'s error arms all end in a
toast (`self.toasts.push(Error, e.to_string())` — `AegisError`'s `Display` is
already user-readable). While any toast is alive, `request_repaint_after` so
expiry doesn't wait for mouse movement. (Crate alternative: `egui-notify`;
but this is ~80 lines and full visual control is the theme of §5 — build it.)

---

## 7. New dependencies

All versions indicative; add to `[workspace.dependencies]` and reference with
`workspace = true`.

| Dependency | Goes into | For | When |
|---|---|---|---|
| `geojson` | `aegis-io` | GeoJSON driver | §4.2, early |
| `egui_extras` | `aegis-app` | virtualized attribute table | §4.6 |
| `earcutr` | `aegis-render` | polygon triangulation | §4.10.1 |
| `serde` (+derive) | feature-gated in core/vector/raster/project; plain in app | persistence | §4.8, §5.3.6 |
| `ron` (or `serde_json`) | `aegis-project`, `aegis-app` | project files, layout | §4.8 |
| `shapefile` | `aegis-io` | shapefile driver | §4.2 |
| `tiff` / gdal-track | `aegis-io` | raster driver | §4.2 |
| `rstar` | `aegis-vector` or `aegis-render` | spatial index for culling/hit-test | §4.10.3 |
| `wgpu`, `egui_wgpu`; eframe `wgpu` feature | `aegis-render`; `aegis-app` | GPU pipeline | §4.10.3 |
| `notify` | `aegis-io` | catalog auto-refresh | optional, late |
| `proj` | new `aegis-crs` or `aegis-io` | reprojection | far future |
| `rfd` | `aegis-app` | native dialogs **only as stopgap** | optional |

Deliberately absent: async runtimes (threads + mpsc suffice, §4.7.3), any
docking crate like `egui_dock`/`egui_tiles` (the artboard is free-floating,
not docked — `egui::Window` covers it; revisit `egui_tiles` only if you later
want snap-docking zones).

Every new dependency inherits the workspace lints via the existing
`[lints] workspace = true` in each member — no action needed, but expect to
write small lint-clean wrappers around crates that return panicky APIs.

## 8. Cross-cutting rules

### 8.1 Lint survival guide (the workspace denies pedantic + nursery + panics)

Patterns that keep new code compiling, mapped to the situations this guide
creates:

| Situation | Banned reflex | Use instead |
|---|---|---|
| `Option`/`Result` you "know" is fine | `.unwrap()` | `let Some(x) = ... else { return }`, `map_or`, `?` + `AegisError`, toast |
| Vec/map element access (attribute table!) | `v[i]` | `.get(i)` + graceful `None` arm |
| Counters, sizes (`row * width`) | bare `+`/`*` on usize | `checked_*`/`saturating_*`, or restructure to iterators |
| f64→f32 at paint time | `as f32` | only via `to_pos2` (and the future GPU boundary, §4.10.3) |
| f32→f64 from egui input | `as f64` | `f64::from(x)` |
| String truncation for labels | `&s[..n]` | `char_indices`-based helper or `Cow` + egui's own `truncate()` layout |
| "I'll do this later" markers | `todo!()` | `AegisError::NotYetImplemented { feature }` — it exists for this |
| Docs on new pub items | skipping them | pedantic requires `# Errors` sections on fallible fns — copy the style already in `driver.rs` |

`--all-targets` means **tests are linted too**: prefer `Result`-returning
tests (`fn t() -> Result<(), AegisError>` + `?`) over `unwrap`; where a test
genuinely wants indexing, a scoped `#[allow(clippy::indexing_slicing, reason
= "test fixture of known shape")]` with a reason string is the established
pattern (see `to_pos2`).

### 8.2 State placement summary

- **Document state** (survives save/load): `aegis-project` — layers,
  symbology values, selection, (later) undo, maps.
- **Session state** (survives restart, not part of the document):
  `aegis-app` + eframe storage — workspace layout, folder connections,
  theme preference.
- **Frame/transient state**: `aegis-app` structs — open dialogs, rename
  buffers, drag state, toasts, command queue.
- **Caches** (derived, rebuildable): `CatalogCache` (io), triangulation/
  texture caches (app, inside the render seam), never serialized.

### 8.3 The seams, restated as "what NOT to touch"

- Adding a file format → touch `aegis-io` only.
- Adding a geoprocessing tool → touch `aegis-geoprocessing` only.
- Adding a data kind (point cloud, TIN) → `LayerSource` variant + renderer
  arm only.
- Swapping/upgrading the renderer → inside `render_egui`/`MapRenderer` only.
- Restyling the whole app → `theme.rs` only.
- If a change forces edits outside its designated crate, stop and re-read §2
  — the design is telling you something.

### 8.4 Testing expectations

Lower crates are pure and must grow tests alongside features: `fit_rect` and
existing camera math (`aegis-render`), `list_dir` classification/sorting
against a `tempfile`-built tree (`aegis-io`, dev-dependency), driver
round-trips on fixtures (§4.2), tool param validation (`aegis-geoprocessing`),
project (de)serialization including the broken-link path (§4.8). `aegis-app`
stays thin enough that manual testing + the compiler suffice for now;
`egui_kittest` exists if panel logic ever gets hairy.

---

## 9. Suggested build order

Each phase is shippable and sets up the next. Dependencies are noted; within
a phase, items are parallelizable.

**Phase 0 — Foundations (do first, small):**
§3 state refactor + command queue + panel content/container split; §6 toasts;
§5.1 `theme.rs` skeleton applied via `CreationContext` (palette can start as
"egui defaults, renamed" — the point is the *seam*).

**Phase 1 — Catalog & first data (the §4.1 example, end-to-end):**
§4.1 list_dir/cache/tree/context-menu/folder-picker → §4.2 GeoJSON driver →
§4.3 add-to-map. *Exit criterion: right-click → connect a folder → expand →
double-click a .geojson → it renders.*

**Phase 2 — Layer interaction:**
§4.4 contents (selection, reorder, rename, remove, zoom-to via §4.9
`fit_rect`), §4.5 symbology pane, §5.4 real menus + status bar.

**Phase 3 — Data depth:**
§4.10.1 polygon fills; §4.6 attribute table (+ `egui_extras`); §4.2
shapefile driver (+ sidecar suppression).

**Phase 4 — The artboard (the §5.3 example):**
Stage-1 floating windows behind a View toggle → maps-as-panels with
per-view cameras (`MapViewId`) → canvas background + context menu →
§5.3.6 persistence → retire the docked layout. Then §5.1 full theming pass
(it lands best when the artboard exists to show it off).

**Phase 5 — Geoprocessing:**
§4.7 tools, auto-dialogs, job runner, status-bar spinner.

**Phase 6 — Persistence & polish:**
§4.8 project save/load (serde features across crates, broken-link layers);
§5.2 custom widgets pass; optionally undecorated window + custom title bar.

**Phase 7 — Scale:**
§4.2 raster driver + §4.10.2 raster rendering; then §4.10.3 wgpu pipeline +
`rstar` indexes when data sizes demand it.

Rationale for the order: Phase 1 makes AeGIS *load real data*, which changes
every subsequent decision from hypothetical to observed; the artboard waits
until there are enough panels (Contents/Catalog/Symbology/Table) for a
workspace to mean something; wgpu waits until real datasets prove where the
CPU path breaks.
