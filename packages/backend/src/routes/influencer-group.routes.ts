import { Router } from 'express';
import * as groupService from '../services/influencer-group.service';
import { authenticate, requireFactoryMember, enrichUserData } from '../middleware/auth.middleware';

const router = Router();

// Apply enrichUserData middleware to all routes to ensure brandId is available
router.use(enrichUserData);

/**
 * @route   POST /api/influencers/groups
 * @desc    Create a new influencer group
 * @access  Private
 */
router.post('/', authenticate, requireFactoryMember, async (req, res, next) => {
  try {
    const { name, color, description } = req.body;
    const { brandId, userId } = req.user!;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '分组名称不能为空' },
      });
    }

    const group = await groupService.createGroup({
      brandId,
      name,
      color,
      description,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/influencers/groups
 * @desc    List all groups in factory
 * @access  Private
 */
router.get('/', authenticate, requireFactoryMember, async (req, res, next) => {
  try {
    const { brandId } = req.user!;

    const groups = await groupService.listGroups(brandId);

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/influencers/groups/:id
 * @desc    Get group by ID
 * @access  Private
 */
router.get('/:id', authenticate, requireFactoryMember, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brandId } = req.user!;

    const group = await groupService.getGroupById(id, brandId);

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/influencers/groups/:id/stats
 * @desc    Get group statistics
 * @access  Private
 */
router.get('/:id/stats', authenticate, requireFactoryMember, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brandId } = req.user!;

    const stats = await groupService.getGroupStats(id, brandId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/influencers/groups/:id/influencers
 * @desc    Get influencers in a group
 * @access  Private
 */
router.get('/:id/influencers', authenticate, requireFactoryMember, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brandId } = req.user!;

    const influencers = await groupService.getGroupInfluencers(id, brandId);

    res.json({
      success: true,
      data: influencers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/influencers/groups/:id
 * @desc    Update group
 * @access  Private
 */
router.put('/:id', authenticate, requireFactoryMember, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brandId } = req.user!;
    const { name, color, description } = req.body;

    const group = await groupService.updateGroup(id, brandId, {
      name,
      color,
      description,
    });

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/influencers/groups/:id
 * @desc    Delete group
 * @access  Private
 */
router.delete('/:id', authenticate, requireFactoryMember, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { brandId } = req.user!;

    await groupService.deleteGroup(id, brandId);

    res.json({
      success: true,
      message: '分组已删除',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/influencers/groups/batch-move
 * @desc    Batch move influencers to group
 * @access  Private
 */
router.post('/batch-move', authenticate, requireFactoryMember, async (req, res, next) => {
  try {
    const { influencerIds, groupId } = req.body;
    const { brandId } = req.user!;

    if (!influencerIds || !Array.isArray(influencerIds) || influencerIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '请选择要移动的达人' },
      });
    }

    await groupService.batchMoveInfluencersToGroup(influencerIds, groupId, brandId);

    res.json({
      success: true,
      message: `已将 ${influencerIds.length} 个达人移动到分组`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
