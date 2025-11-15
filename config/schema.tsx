// db/schema/users.ts
import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  pgEnum,
  boolean,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ========= Enums ========= */

export const userRoleEnum = pgEnum("user_role", ["candidate", "employer"]);
export const authProviderEnum = pgEnum("auth_provider", ["credentials", "google"]);
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type AuthProvider = (typeof authProviderEnum.enumValues)[number];

export const jobStatusEnum = pgEnum("job_status", ["draft", "open", "closed"]);
export const applicationStatusEnum = pgEnum("application_status", [
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "hired",
]);

/* ========= Users ========= */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),

    // credentials / provider
    passwordHash: text("password_hash"),
    provider: authProviderEnum("provider").notNull().default("credentials"),
    googleId: varchar("google_id", { length: 255 }), // sub from Google

    role: userRoleEnum("role").notNull(),

    // employers only
    companyName: varchar("company_name", { length: 255 }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    // helpful query indexes
    // helpful query indexes
    usersRoleIdx: index("users_role_idx").on(t.role),
    usersCreatedIdx: index("users_created_at_idx").on(t.createdAt),
    // avoid duplicate Google links
    // avoid duplicate Google links
    usersGoogleIdUq: uniqueIndex("users_google_id_uq").on(t.googleId),
  })
);

/* ========= Jobs (posted by employers) ========= */

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    employerId: uuid("employer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(), // unique below
    description: text("description").notNull(),

    location: varchar("location", { length: 255 }).notNull(), // e.g. "Remote · India"
    employmentType: varchar("employment_type", { length: 100 }).notNull(), // e.g. "Full-time"
    remote: boolean("remote").notNull().default(false),

    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    currency: varchar("currency", { length: 10 }).default("INR"),

    status: jobStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    jobsEmployerIdx: index("jobs_employer_id_idx").on(t.employerId),
    jobsStatusIdx: index("jobs_status_idx").on(t.status),
    jobsPublishedIdx: index("jobs_published_at_idx").on(t.publishedAt),
    jobsSlugUq: uniqueIndex("jobs_slug_uq").on(t.slug),
  })
);

/* ========= Applications (candidates → jobs) ========= */

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),

    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    status: applicationStatusEnum("status").notNull().default("applied"),
    step: varchar("step", { length: 255 }).notNull().default("Application received"),

    resumeUrl: text("resume_url"),
    coverLetter: text("cover_letter"),

    nextInterviewAt: timestamp("next_interview_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    appsJobIdx: index("applications_job_id_idx").on(t.jobId),
    appsCandidateIdx: index("applications_candidate_id_idx").on(t.candidateId),
    appsStatusIdx: index("applications_status_idx").on(t.status),
    appsNextInterviewIdx: index("applications_next_interview_at_idx").on(t.nextInterviewAt),
  })
);

/* ========= Saved Jobs (candidate bookmarks) ========= */

export const savedJobs = pgTable(
  "saved_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Prevent duplicates: same candidate saving the same job multiple times
    candidateJobUnique: uniqueIndex("saved_jobs_candidate_job_unique").on(
      table.candidateId,
      table.jobId
    ),
  })
);

/* ========= Candidate Profile ========= */

export const userProfiles = pgTable(
  "user_profiles",
  {
    // one-to-one with users
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),

    // Basic contact / presence
    phone: varchar("phone", { length: 32 }),
    location: varchar("location", { length: 255 }),
    website: varchar("website", { length: 255 }),

    // Candidate “About”
    headline: varchar("headline", { length: 255 }),
    bio: text("bio"),

    // Candidate extras
    experienceYears: integer("experience_years"),
    preferredTitle: varchar("preferred_title", { length: 255 }),
    preferredLocation: varchar("preferred_location", { length: 255 }),
    salaryRange: varchar("salary_range", { length: 64 }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userProfilesLocationIdx: index("user_profiles_location_idx").on(t.location),
  })
);

export const userSkills = pgTable(
  "user_skills",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skill: varchar("skill", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.skill] }), // avoid duplicates
  })
);

/* ========= Employer Profile ========= */

export const employerProfiles = pgTable("employer_profiles", {
  // one-to-one with users (role = employer)
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  companyWebsite: varchar("company_website", { length: 255 }),
  companySize: varchar("company_size", { length: 64 }),
  companyBio: text("company_bio"),

  hiringLocations: varchar("hiring_locations", { length: 255 }),
  hiringFocus: varchar("hiring_focus", { length: 255 }),
  hiringNotes: text("hiring_notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ========= Relations ========= */

export const usersRelations = relations(users, ({ one, many }) => ({
  jobs: many(jobs),
  applications: many(applications),
  savedJobs: many(savedJobs),

  // NEW: wire in profile relationships
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  employerProfile: one(employerProfiles, {
    fields: [users.id],
    references: [employerProfiles.userId],
  }),
  skills: many(userSkills),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  employer: one(users, {
    fields: [jobs.employerId],
    references: [users.id],
  }),
  applications: many(applications),
  savedBy: many(savedJobs),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  candidate: one(users, {
    fields: [applications.candidateId],
    references: [users.id],
  }),
}));

export const savedJobsRelations = relations(savedJobs, ({ one }) => ({
  candidate: one(users, {
    fields: [savedJobs.candidateId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [savedJobs.jobId],
    references: [jobs.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
  skills: many(userSkills),
}));

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, {
    fields: [userSkills.userId],
    references: [users.id],
  }),
}));

export const employerProfilesRelations = relations(employerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [employerProfiles.userId],
    references: [users.id],
  }),
}));


export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  otpHash: varchar("otp_hash", { length: 255 }).notNull(),

  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

  used: boolean("used").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});


export const userSettings = pgTable("user_settings", {
  // One settings row per user
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  // Notifications
  jobAlertsEmail: boolean("job_alerts_email").notNull().default(true),
  jobAlertsPush: boolean("job_alerts_push").notNull().default(true),
  activityEmails: boolean("activity_emails").notNull().default(true),
  marketingEmails: boolean("marketing_emails").notNull().default(false),

  // Security
  loginAlerts: boolean("login_alerts").notNull().default(true),
  twoFactor: boolean("two_factor").notNull().default(false),

  // UI
  theme: varchar("theme", { length: 20 }).notNull().default("system"), // "system" | "light" | "dark"

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});