pub fn resolve_shell(shell: Option<&str>) -> Result<String, Error> {
    match shell {
        Some("bash") => Ok("bash -e -o pipefail".into()),
        Some("sh") => Ok("sh -e".into()),
        Some(custom) => resolve_custom_shell(custom),
        None => Ok("bash -e".into()),
    }
}
