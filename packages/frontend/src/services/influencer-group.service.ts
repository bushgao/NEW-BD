import api from './api';

export interface InfluencerGroup {
  id: string;
  brandId: string;
  name: string;
  color: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  influencerCount?: number;
  stats?: GroupStats;
}

export interface GroupStats {
  totalInfluencers: number;
  totalCollaborations: number;
  avgROI: number;
  totalGMV: number;
}

export interface CreateGroupInput {
  name: string;
  color?: string;
  description?: string;
}

export interface UpdateGroupInput {
  name?: string;
  color?: string;
  description?: string;
}

/**
 * 创建分组
 */
export async function createGroup(data: CreateGroupInput): Promise<InfluencerGroup> {
  const response = await api.post('/influencers/groups', data);
  return response.data.data;
}

/**
 * 获取所有分组
 */
export async function listGroups(): Promise<InfluencerGroup[]> {
  const response = await api.get('/influencers/groups');
  return response.data.data;
}

/**
 * 获取分组详情
 */
export async function getGroup(id: string): Promise<InfluencerGroup> {
  const response = await api.get(`/influencers/groups/${id}`);
  return response.data.data;
}

/**
 * 获取分组统计
 */
export async function getGroupStats(id: string): Promise<GroupStats> {
  const response = await api.get(`/influencers/groups/${id}/stats`);
  return response.data.data;
}

/**
 * 获取分组中的达人
 */
export async function getGroupInfluencers(id: string): Promise<any[]> {
  const response = await api.get(`/influencers/groups/${id}/influencers`);
  return response.data.data;
}

/**
 * 更新分组
 */
export async function updateGroup(id: string, data: UpdateGroupInput): Promise<InfluencerGroup> {
  const response = await api.put(`/influencers/groups/${id}`, data);
  return response.data.data;
}

/**
 * 删除分组
 */
export async function deleteGroup(id: string): Promise<void> {
  await api.delete(`/influencers/groups/${id}`);
}

/**
 * 移动达人到分组
 */
export async function moveInfluencerToGroup(influencerId: string, groupId: string | null): Promise<void> {
  await api.put(`/influencers/${influencerId}/group`, { groupId });
}

/**
 * 批量移动达人到分组
 */
export async function batchMoveInfluencersToGroup(influencerIds: string[], groupId: string | null): Promise<void> {
  await api.post('/influencers/groups/batch-move', { influencerIds, groupId });
}
