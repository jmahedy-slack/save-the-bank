#!/usr/bin/env node
/**
 * Run once to provision the #save-the-bank Slack channel and post the launch preview.
 *
 * Usage:
 *   SLACK_BOT_TOKEN=xoxb-... GAME_URL=https://your-app.herokuapp.com node provision.js
 */

const TOKEN    = process.env.SLACK_BOT_TOKEN;
const GAME_URL = process.env.GAME_URL || "https://savethebank.herokuapp.com";
const CHANNEL  = "save-the-bank";

if (!TOKEN) {
  console.error("Set SLACK_BOT_TOKEN before running.");
  process.exit(1);
}

async function slack(method, body) {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`${method} failed: ${json.error}`);
  return json;
}

async function main() {
  // 1. Create the channel (idempotent — fails gracefully if it already exists)
  let channelId;
  try {
    const created = await slack("conversations.create", { name: CHANNEL, is_private: false });
    channelId = created.channel.id;
    console.log(`Created #${CHANNEL} (${channelId})`);
  } catch (err) {
    if (err.message.includes("name_taken")) {
      // Channel exists — look it up
      const list = await slack("conversations.list", { exclude_archived: true, limit: 200 });
      const found = list.channels.find(c => c.name === CHANNEL);
      if (!found) throw new Error(`#${CHANNEL} exists but could not be found in list.`);
      channelId = found.id;
      console.log(`#${CHANNEL} already exists (${channelId}), posting to it.`);
    } else {
      throw err;
    }
  }

  // 2. Post the launch preview using Block Kit
  await slack("chat.postMessage", {
    channel: channelId,
    text: ":rotating_light: SEV-1: Save the Bank is live",
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: ":rotating_light:  SEV-1: Save the Bank", emoji: true },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*The bank is going down.* Systems are failing, alerts are firing, and it's on you to fix it.\n\nNavigate the server room, hunt the bugs, restore services — before time runs out.",
        },
      },
      { type: "divider" },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: "*Platform*\nNatWest Engineering Arcade" },
          { type: "mrkdwn", text: "*Mode*\nSEV-1 Incident Simulation" },
          { type: "mrkdwn", text: "*Controls*\nWASD / Arrow keys" },
          { type: "mrkdwn", text: "*Goal*\nFix all 5 bug enemies" },
        ],
      },
      { type: "divider" },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            style: "primary",
            text: { type: "plain_text", text: "Play Now", emoji: true },
            url: GAME_URL,
            action_id: "play_now",
          },
          {
            type: "button",
            text: { type: "plain_text", text: "View Leaderboard", emoji: true },
            action_id: "leaderboard",
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Use </savethebank start:${CHANNEL}> to kick off a session • Built for NatWest Engineering events`,
          },
        ],
      },
    ],
  });

  console.log("Preview posted to #save-the-bank. Done.");
}

main().catch(err => { console.error(err.message); process.exit(1); });
