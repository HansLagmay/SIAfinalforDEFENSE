const {
  canManagePropertyAsAgent,
  canAccessInquiryAsAgent
} = require('../accessControl');

describe('accessControl helpers', () => {
  it('allows agent to manage property when created_by_user_id matches', () => {
    const user = { id: 'agent-1', role: 'agent', name: 'Agent A' };
    const property = { created_by_user_id: 'agent-1', created_by: 'Someone Else' };

    expect(canManagePropertyAsAgent(user, property)).toBe(true);
  });

  it('falls back to created_by name for legacy rows', () => {
    const user = { id: 'agent-1', role: 'agent', name: 'Agent A' };
    const property = { created_by_user_id: null, created_by: 'Agent A' };

    expect(canManagePropertyAsAgent(user, property)).toBe(true);
  });

  it('rejects non-owner agent', () => {
    const user = { id: 'agent-1', role: 'agent', name: 'Agent A' };
    const property = { created_by_user_id: 'agent-2', created_by: 'Agent B' };

    expect(canManagePropertyAsAgent(user, property)).toBe(false);
  });

  it('allows inquiry access when assigned or claimed by agent', () => {
    const user = { id: 'agent-1', role: 'agent' };

    expect(canAccessInquiryAsAgent(user, { assigned_to: 'agent-1', claimed_by: null })).toBe(true);
    expect(canAccessInquiryAsAgent(user, { assigned_to: null, claimed_by: 'agent-1' })).toBe(true);
    expect(canAccessInquiryAsAgent(user, { assigned_to: 'agent-2', claimed_by: null })).toBe(false);
  });
});
