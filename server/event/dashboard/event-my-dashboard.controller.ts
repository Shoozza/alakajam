import { BookshelfCollectionOf, PostBookshelfModel } from "bookshelf";
import db from "server/core/db";
import likeService from "server/post/like/like.service";
import postService from "server/post/post.service";
import { CustomRequest, CustomResponse } from "server/types";
import { EventLocals } from "../event.middleware";
import eventService from "../event.service";
import eventParticipationService from "./event-participation.service";
import forms from "server/core/forms";
import links from "server/core/links";
import constants from "server/core/constants";

/**
 * Manage my participation to an event
 */
export async function viewEventDashboard(req: CustomRequest, res: CustomResponse<EventLocals>) {
  const { user, event } = res.locals;

  res.locals.pageTitle += " | Event dashboard";

  const hasJoinedEvent = await eventParticipationService.hasJoinedEvent(event, user);
  if (hasJoinedEvent) {
    await myEntryHavingJoined(res);
  } else {
    await myEntryNotHavingJoined(res);
  }
}

export async function postEventDashboard(req: CustomRequest, res: CustomResponse<EventLocals>) {
  const { user, event } = res.locals;

  if (req.body["streamer-preferences"] !== undefined) {
    await eventParticipationService.setStreamingPreferences(event, user, {
      isStreamer: req.body["is-streamer"] === "true",
      streamerDescription: forms.sanitizeString(req.body["streamer-description"], { maxLength: constants.MAX_DESCRIPTION })
    });
  }

  res.redirect(links.routeUrl(event, "event", "dashboard"));
}

async function myEntryHavingJoined(res: CustomResponse<EventLocals>) {
  const { user, event } = res.locals;

  const entry = await eventService.findUserEntryForEvent(user, event.get("id"), {
    withRelated: [ "posts.likes", "posts.userRoles", "userRoles" ]
  });

  let postsCollection: BookshelfCollectionOf<PostBookshelfModel>
    = new db.Collection() as BookshelfCollectionOf<PostBookshelfModel>;
  if (entry) {
    postsCollection = entry.related("posts");
  } else {
    postsCollection = await postService.findPosts({
      userId: user.get("id"),
      eventId: event.get("id"),
      specialPostType: null
    });
  }

  const latestPost = postsCollection.find((post) => {
    return post.get("author_user_id") === user.get("id");
  });

  await user.loadDetails();
  res.render("event/dashboard/event-my-dashboard", {
    entry,
    latestPost,
    posts: postsCollection.models,
    userLikes: await likeService.findUserLikeInfo(postsCollection.models, user),
    eventParticipation: await eventParticipationService.getEventParticipation(event, user)
  });
}


async function myEntryNotHavingJoined(res: CustomResponse<EventLocals>) {
  res.render("event/dashboard/event-my-dashboard-join");
}
