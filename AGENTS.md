<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Store organizer question edits as server-only database overrides of stable question IDs; resolve them for both team content and answer checking so shuffling and existing progress remain intact.
- Render live team questions and organizer previews through the same presentation component; preview hint reveals stay local and never call gameplay mutations.
