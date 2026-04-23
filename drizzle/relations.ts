import { relations } from "drizzle-orm/relations";
import { kpiDefinitions, kpiAlerts, users, sessions, companies, whatsappSessions, whatsappMessages, kpiHistory } from "./schema";

export const kpiAlertsRelations = relations(kpiAlerts, ({one}) => ({
	kpiDefinition: one(kpiDefinitions, {
		fields: [kpiAlerts.kpiId],
		references: [kpiDefinitions.id]
	}),
}));

export const kpiDefinitionsRelations = relations(kpiDefinitions, ({many}) => ({
	kpiAlerts: many(kpiAlerts),
	kpiHistories: many(kpiHistory),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	sessions: many(sessions),
}));

export const whatsappSessionsRelations = relations(whatsappSessions, ({one, many}) => ({
	company: one(companies, {
		fields: [whatsappSessions.companyId],
		references: [companies.id]
	}),
	whatsappMessages: many(whatsappMessages),
}));

export const companiesRelations = relations(companies, ({many}) => ({
	whatsappSessions: many(whatsappSessions),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({one}) => ({
	whatsappSession: one(whatsappSessions, {
		fields: [whatsappMessages.sessionId],
		references: [whatsappSessions.id]
	}),
}));

export const kpiHistoryRelations = relations(kpiHistory, ({one}) => ({
	kpiDefinition: one(kpiDefinitions, {
		fields: [kpiHistory.kpiId],
		references: [kpiDefinitions.id]
	}),
}));