/* eslint-disable camelcase */

import { BeforeInsert, BeforeUpdate, Column, Entity, Index, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { BookshelfCompatibleEntity } from "./bookshelf-compatible.entity";
import { ColumnTypes } from "./column-types";
import { Comment } from "./comment.entity";
import { EntryScore } from "./entry-score.entity";
import { EventParticipation } from "./event-participation.entity";
import { Like } from "./like.entity";
import { Post } from "./post.entity";
import { ThemeVote } from "./theme-vote.entity";
import { TournamentScore } from "./tournament-score.entity";
import UserApprobationStateTransformer, { UserApprobationState, USER_PENDING_VALUE } from "./transformer/user-approbation-state.transformer";
import { UserDetails } from "./user-details.entity";
import { UserRole } from "./user-role.entity";

/**
 * User account information.
 */
@Entity()
export class User extends BookshelfCompatibleEntity {

  public constructor(name: string, email: string) {
    super();
    this.name = name;
    this.email = email;
    this.title = name;
    this.details = new UserDetails();
  }

  @PrimaryGeneratedColumn()
  public id: number;

  /**
   * (NB. Lowercase name is indexed / no TypeORM support)
   */
  @Column(ColumnTypes.varchar({ unique: true }))
  public name: string;

  @Column(ColumnTypes.varchar({ nullable: true }))
  public title?: string;

  @Column(ColumnTypes.varchar())
  // TODO @Unique
  public email: string;

  @Column(ColumnTypes.varchar({ nullable: true }))
  public avatar?: string;

  @Column(ColumnTypes.varchar({ nullable: true }))
  public timezone?: string;

  /**
   * "true" if set ("1" on SQLite), "" or NULL otherwise.
   * TODO Migrate to boolean
   */
  @Column(ColumnTypes.varchar({ nullable: true }))
  public is_mod?: string;

  /**
   * "true" if set ("1" on SQLite), "" or NULL otherwise.
   * TODO Migrate to boolean
   */
  @Column(ColumnTypes.varchar({ nullable: true }))
  public is_admin?: string;

  /**
   * If true, disallows this user to post anonymous comments
   */
  @Column({ nullable: true })
  public disallow_anonymous: boolean;

  @Column(ColumnTypes.varchar())
  public password: string;

  @Column(ColumnTypes.varchar())
  public password_salt: string;

  @Column(ColumnTypes.dateTime({ nullable: true, default: () => null }))
  public notifications_last_read?: Date;

  @Column(ColumnTypes.numeric(1, 0, { transformer: UserApprobationStateTransformer, default: USER_PENDING_VALUE }))
  @Index()
  public approbation_state: UserApprobationState;

  @OneToOne(() => UserDetails, (userDetails) => userDetails.user, { cascade: true })
  public details: UserDetails;

  @OneToMany(() => UserRole, (userRole) => userRole.user, { cascade: true })
  public roles: UserRole[];

  @OneToMany(() => EntryScore, (entryScore) => entryScore.user, { cascade: true })
  public entryScores: EntryScore[];

  @OneToMany(() => TournamentScore, (tournamentScore) => tournamentScore.user, { cascade: true })
  public tournamentScores: TournamentScore[];

  @OneToMany(() => Comment, (comment) => comment.user, { cascade: true })
  public comments: Comment[];

  @OneToMany(() => Post, (post) => post.author, { cascade: true })
  public posts: Post[];

  @OneToMany(() => Like, (like) => like.user, { cascade: true })
  public likes: Like[];

  @OneToMany(() => ThemeVote, (themeVote) => themeVote.user, { cascade: true })
  public themeVotes: ThemeVote[];

  @OneToMany(() => EventParticipation, (eventParticipation) => eventParticipation.user, { cascade: true })
  public eventParticipations: EventParticipation[];

  @Column(ColumnTypes.dateTime())
  public created_at: Date;

  @Column(ColumnTypes.dateTime())
  public updated_at: Date;

  // XXX @CreateDateColumn / @UpdateDateColumn not working on user table

  @BeforeInsert()
  public setCreateDate(): void {
    this.created_at = new Date();
    this.updated_at = new Date();
  }

  @BeforeUpdate()
  public setUpdateDate(): void {
    this.updated_at = new Date();
  }

  /**
   * Number of entries, including for external events.
   * Only set when using `userService.findUsers()` with flag `entriesCount`.
   */
  public readonly entriesCount?: number;

  /**
   * Number of entries to Alakajam event.
   * Only set when using `userService.findUsers()` with flag `entriesCount`.
   */
  public readonly akjEntriesCount?: number;

  public async loadDetails(): Promise<void> {
    await this.loadOneToOne(User, "details", UserDetails);
  }

  public dependents(): Array<keyof this> {
    return [ "details", "roles", "entryScores", "tournamentScores", "comments", "posts", "likes", "themeVotes"];
  }

}
