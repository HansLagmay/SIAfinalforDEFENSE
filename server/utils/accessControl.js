const hasRole = (user, role) => !!user && user.role === role;

const isAdmin = (user) => hasRole(user, 'admin');
const isAgent = (user) => hasRole(user, 'agent');

const isAgentPropertyOwner = (user, property) => {
  if (!isAgent(user) || !property) return false;

  if (property.created_by_user_id) {
    return property.created_by_user_id === user.id;
  }

  return Boolean(property.created_by) && property.created_by === user.name;
};

const canManagePropertyAsAgent = (user, property) => {
  if (!isAgent(user)) return false;
  return isAgentPropertyOwner(user, property);
};

const canAccessInquiryAsAgent = (user, inquiry) => {
  if (!isAgent(user) || !inquiry) return false;
  return inquiry.assigned_to === user.id || inquiry.claimed_by === user.id;
};

module.exports = {
  isAdmin,
  isAgent,
  isAgentPropertyOwner,
  canManagePropertyAsAgent,
  canAccessInquiryAsAgent
};
