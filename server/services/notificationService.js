const { v4: uuidv4 } = require('uuid');

const createNotification = async (pool, {
  userId,
  userRole,
  type,
  title,
  message,
  relatedId = null,
  relatedType = null
}) => {
  if (!userId || !userRole || !type || !title || !message) {
    return null;
  }

  const id = uuidv4();

  await pool.execute(
    `INSERT INTO notifications
      (id, user_id, user_role, type, title, message, related_id, related_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [id, userId, userRole, type, title, message, relatedId, relatedType]
  );

  return id;
};

module.exports = { createNotification };
