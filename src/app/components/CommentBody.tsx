import { parseCommentBody } from "../data/richText";

export function CommentBody({ body }: { body: string }) {
  return (
    <p className="comment-body">
      {parseCommentBody(body).map((part, index) =>
        part.type === "mention" ? (
          <span className="mention-chip" key={`${part.memberId}-${index}`}>
            @{part.name}
          </span>
        ) : (
          <span key={`text-${index}`}>{part.value}</span>
        ),
      )}
    </p>
  );
}
