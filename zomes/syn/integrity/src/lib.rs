mod commit;
mod document;
mod workspace;

pub use commit::*;
pub use document::*;
pub use workspace::*;

use hdi::prelude::*;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Document(Document),
    Workspace(Workspace),
    Commit(Commit),
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_link_types]
pub enum LinkTypes {
    TagToDocument,
    DocumentToWorkspaces,
    DocumentToCommits,
    WorkspaceToTip,
    WorkspaceToParticipant,
}
