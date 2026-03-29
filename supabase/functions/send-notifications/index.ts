import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

webpush.setVapidDetails(
  "mailto:jakenbake350@users.noreply.github.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
);

function isOverdue(due_date: string) {
  return new Date(due_date) < new Date(new Date().toDateString());
}
function isDueSoon(due_date: string) {
  const diff = (new Date(due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 3;
}

Deno.serve(async () => {
  // Get all active tasks with due dates
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("done", false)
    .eq("archived", false)
    .not("due_date", "is", null);

  if (!tasks || tasks.length === 0) {
    return new Response("No tasks to notify", { status: 200 });
  }

  // Group by board_id, find tasks that need notification
  const byBoard: Record<string, { overdue: string[]; soon: string[] }> = {};
  for (const task of tasks) {
    const bid = task.board_id;
    if (!byBoard[bid]) byBoard[bid] = { overdue: [], soon: [] };
    if (isOverdue(task.due_date)) byBoard[bid].overdue.push(task.text);
    else if (isDueSoon(task.due_date)) byBoard[bid].soon.push(task.text);
  }

  // Get all push subscriptions
  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs) return new Response("No subscriptions", { status: 200 });

  let sent = 0;
  for (const sub of subs) {
    const board = byBoard[sub.board_id];
    if (!board) continue;

    const parts = [];
    if (board.overdue.length > 0) parts.push(`${board.overdue.length} overdue`);
    if (board.soon.length > 0) parts.push(`${board.soon.length} due soon`);
    if (parts.length === 0) continue;

    const firstTask = board.overdue[0] || board.soon[0];
    const title = parts.join(" · ");
    const body = firstTask + (board.overdue.length + board.soon.length > 1
      ? ` +${board.overdue.length + board.soon.length - 1} more`
      : "");

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: `Fern's List — ${title}`, body, tag: "fernslist-reminder" })
      );
      sent++;
    } catch (e: unknown) {
      // Remove dead subscriptions
      if (e instanceof Error && e.message?.includes("410")) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  }

  return new Response(`Sent ${sent} notifications`, { status: 200 });
});
