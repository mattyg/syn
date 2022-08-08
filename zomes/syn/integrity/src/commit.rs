use hdi::prelude::*;

#[hdk_entry_helper]
pub struct Commit {
  pub state: SerializedBytes,

  pub previous_commit_hashes: Vec<EntryHash>,

  pub authors: Vec<AgentPubKey>,
  pub witnesses: Vec<AgentPubKey>, // maybe?

  pub meta: Option<SerializedBytes>,
}

