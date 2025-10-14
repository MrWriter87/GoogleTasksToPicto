import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

export class GoogleAuthHelper {
  constructor({ clientId, clientSecret, redirectUri, tokenDir }) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.tokenDir = tokenDir;
    this.tokenPath = path.join(tokenDir, 'tokens.json');
    this.oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );
    if (!fs.existsSync(tokenDir)) fs.mkdirSync(tokenDir, { recursive: true });
    this.loadTokensIfAny();
  }

  loadTokensIfAny() {
    if (fs.existsSync(this.tokenPath)) {
      const tok = JSON.parse(fs.readFileSync(this.tokenPath, 'utf-8'));
      this.oauth2Client.setCredentials(tok);
    }
  }

  saveTokens(tokens) {
    fs.writeFileSync(this.tokenPath, JSON.stringify(tokens, null, 2));
  }

  generateAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/tasks'
    ];
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes
    });
  }

  async exchangeCodeForToken(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    this.saveTokens(tokens);
  }

  async getAuthedClient() {
    const cred = this.oauth2Client.credentials;
    if (!cred || (!cred.access_token && !cred.refresh_token)) {
      throw new Error('No valid token. Start auth at /auth/start');
    }
    // Refresh if needed
    if (cred.expiry_date && cred.expiry_date < Date.now()) {
      const newTok = await this.oauth2Client.getAccessToken();
      if (newTok && newTok.token) {
        this.oauth2Client.setCredentials({
          ...this.oauth2Client.credentials,
          access_token: newTok.token
        });
        this.saveTokens(this.oauth2Client.credentials);
      }
    }
    return this.oauth2Client;
  }

  async getTasksClient() {
    const auth = await this.getAuthedClient();
    return google.tasks({ version: 'v1', auth });
  }

  async getListIdByIndex(index = 0) {
    const tasksClient = await this.getTasksClient();
    const resp = await tasksClient.tasklists.list({ maxResults: 100 });
    const lists = resp.data.items || [];
    if (!lists.length) throw new Error('No task lists found');
    if (index < 0 || index >= lists.length) index = 0;
    return lists[index].id;
  }

  async listTasks({ includeCompleted = false } = {}) {
    const tasksClient = await this.getTasksClient();
    const listId = await this.getListIdByIndex(parseInt(process.env.TASKS_LIST_INDEX || '0', 10));
    const resp = await tasksClient.tasks.list({
      tasklist: listId,
      showCompleted: includeCompleted,
      showDeleted: false,
      showHidden: false,
      maxResults: 200
    });
    return (resp.data.items || []).map(t => ({
      id: t.id,
      title: t.title || '',
      notes: t.notes || '',
      status: t.status, // 'needsAction' | 'completed'
      due: t.due || null,
      updated: t.updated || null
    }));
  }

  async toggleTask(taskId) {
    const tasksClient = await this.getTasksClient();
    const listId = await this.getListIdByIndex(parseInt(process.env.TASKS_LIST_INDEX || '0', 10));
    // First get current
    const current = await tasksClient.tasks.get({ tasklist: listId, task: taskId });
    const status = current.data.status === 'completed' ? 'needsAction' : 'completed';
    const body = { status };
    if (status === 'completed') {
      body.completed = new Date().toISOString();
    } else {
      body.completed = null;
    }
    const updated = await tasksClient.tasks.patch({
      tasklist: listId,
      task: taskId,
      requestBody: body
    });
    return {
      id: updated.data.id,
      title: updated.data.title || '',
      notes: updated.data.notes || '',
      status: updated.data.status,
      due: updated.data.due || null,
      updated: updated.data.updated || null
    };
  }
}
