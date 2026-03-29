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

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, title: string, body: string) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ title, body, tag: "fernslist-reminder" })
    );
    return true;
  } catch (e: unknown) {
    if (e instanceof Error && e.message?.includes("410")) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
    return false;
  }
}

Deno.serve(async () => {
  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs || subs.length === 0) return new Response("No subscriptions", { status: 200 });

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("done", false)
    .eq("archived", false);

  const { data: boards } = await supabase.from("boards").select("*");

  let sent = 0;

  for (const sub of subs) {
    const boardTasks = (tasks || []).filter(t => t.board_id === sub.board_id);
    const board = (boards || []).find(b => b.board_id === sub.board_id);

    const overdue = boardTasks.filter(t => t.due_date && isOverdue(t.due_date));
    const soon = boardTasks.filter(t => t.due_date && isDueSoon(t.due_date));

    if (overdue.length > 0 || soon.length > 0) {
      // Specific task alerts
      const parts = [];
      if (overdue.length > 0) parts.push(`${overdue.length} overdue`);
      if (soon.length > 0) parts.push(`${soon.length} due soon`);
      const firstTask = overdue[0]?.text || soon[0]?.text;
      const extra = overdue.length + soon.length - 1;
      const body = firstTask + (extra > 0 ? ` +${extra} more` : "");
      if (await sendPush(sub, `Fern's List — ${parts.join(" · ")}`, body)) sent++;
    } else if (board) {
      // Inactive board nudge — hasn't opened in 7+ days
      const lastOpened = new Date(board.last_opened);
      const daysSince = (Date.now() - lastOpened.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince >= 7) {
        if (await sendPush(sub, "Fern's List", "You haven't checked your list in a week — anything new to add?")) sent++;
      }
    }
    // else: nothing urgent, opened recently → no notification
  }

  return new Response(`Sent ${sent} notifications`, { status: 200 });
});
