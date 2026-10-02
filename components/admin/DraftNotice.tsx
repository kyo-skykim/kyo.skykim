export default function DraftNotice({ draft }: { draft: {
  message: string; recovery: boolean; restore: () => void; discard: () => void;
} }) {
  return (
    <div className="admin-draft-notice" role="status" aria-live="polite">
      <p>{draft.message}</p>
      {draft.recovery && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={draft.restore}>กู้คืนร่างบนเครื่อง</button>
          <button type="button" onClick={draft.discard}>ใช้ข้อมูลจากเว็บไซต์</button>
        </div>
      )}
    </div>
  );
}
