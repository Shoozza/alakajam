import { BookshelfModel } from "bookshelf";
import eventTournamentService from "server/event/tournament/tournament.service";
import likeService from "server/post/like/like.service";
import postService from "server/post/post.service";
import { CustomRequest, CustomResponse } from "server/types";
import { EventLocals } from "./event.middleware";
import eventService from "./event.service";
import enums from "server/core/enums";
import eventParticipationService from "./dashboard/event-participation.service";

/**
 * Browse event home page
 */
export async function viewEventHome(req: CustomRequest, res: CustomResponse<EventLocals>) {
  const { user, event } = res.locals;

  const posts = await postService.findPosts({
    eventId: event.get("id"),
    specialPostType: "announcement",
  });
  const userEntry = user ? await eventService.findUserEntryForEvent(user, event.get("id")) : undefined;

  // Fetch tournament score
  let tournamentScore: BookshelfModel | undefined;
  if (user && event && event.get("status_tournament") !== "disabled") {
    tournamentScore = await eventTournamentService.findOrCreateTournamentScore(event.get("id"), user.get("id"));
  }

  // Check event participation status
  const hasJoinedEvent = user ? await eventParticipationService.hasJoinedEvent(event, user) : false;
  const inviteToJoin = (event.get("status_entry") !== enums.EVENT.STATUS_ENTRY.CLOSED) ? !hasJoinedEvent : false;

  res.render("event/event-home", {
    posts,
    tournamentScore,
    userEntry,
    userLikes: await likeService.findUserLikeInfo(posts.models, res.locals.user),
    hasJoinedEvent,
    inviteToJoin
  });
}
