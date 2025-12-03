import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Player');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'Player'
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      alert('Please enter a new password');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/users/${selectedUser.id}/password`,
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUser(null);
      alert('Password updated successfully');
      fetchUsers();
    } catch (error) {
      alert('Failed to update password: ' + error.response?.data?.error);
    }
  };

  const handleChangeRole = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/users/${selectedUser.id}/role`,
        { role: selectedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowRoleModal(false);
      setSelectedUser(null);
      alert('Role updated successfully');
      fetchUsers();
    } catch (error) {
      alert('Failed to update role: ' + error.response?.data?.error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.username || !createForm.password || !createForm.full_name) {
      alert('Please fill in all fields');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/users',
        createForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('User created successfully');
      setShowCreateModal(false);
      setCreateForm({ username: '', password: '', full_name: '', role: 'Player' });
      fetchUsers();
    } catch (error) {
      alert('Failed to create user: ' + error.response?.data?.error);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `/api/users/${userToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('User deleted successfully');
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      alert('Failed to delete user: ' + error.response?.data?.error);
    }
  };

  if (loading) return <div className="loading">Loading Admin Panel...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="page-title">⚙️ Admin Panel</h1>
        <button className="button btn-success" onClick={() => setShowCreateModal(true)}>
          ➕ Create User
        </button>
      </div>

      <div className="section">
        <h2 className="section-title">👥 Player Management</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.username}</td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: user.role === 'Admin' ? '#e74c3c' : '#17a2b8',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="button btn-primary btn-small"
                      onClick={() => {
                        setSelectedUser(user);
                        setSelectedRole(user.role);
                        setShowRoleModal(true);
                      }}
                      style={{ marginRight: '5px' }}
                    >
                      Change Role
                    </button>
                    <button
                      className="button btn-secondary btn-small"
                      onClick={() => {
                        setSelectedUser(user);
                        setNewPassword('');
                        setShowPasswordModal(true);
                      }}
                      style={{ marginRight: '5px' }}
                    >
                      Change Password
                    </button>
                    <button
                      className="button btn-danger btn-small"
                      onClick={() => {
                        setUserToDelete(user);
                        setShowDeleteConfirm(true);
                      }}
                      disabled={user.id === 1}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">Create New User</div>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={createForm.full_name}
                  onChange={e => setCreateForm({ ...createForm, full_name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={createForm.username}
                  onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={createForm.role}
                  onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  <option value="Player">Player</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="button btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button btn-success">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">Change Password - {selectedUser.full_name}</div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button btn-secondary"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button btn-primary"
                onClick={handleChangePassword}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">Change Role - {selectedUser.full_name}</div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">New Role</label>
                <select
                  className="form-select"
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                >
                  <option value="Player">Player</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button btn-secondary"
                onClick={() => setShowRoleModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button btn-primary"
                onClick={handleChangeRole}
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ color: '#e74c3c' }}>⚠️ Delete User</div>
            <div className="modal-body">
              <p style={{ marginBottom: '15px' }}>
                Are you sure you want to delete <strong>{userToDelete.full_name}</strong>?
              </p>
              <p style={{ fontSize: '12px', color: '#7f8c8d' }}>
                This action cannot be undone. All associated records will be deleted.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button btn-danger"
                onClick={handleDeleteUser}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
