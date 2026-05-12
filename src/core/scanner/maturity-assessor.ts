import type {
  TechStackInfo,
  ProjectStructure,
  CollaborationInfo,
  PlatformDetectionResult,
  ProjectMaturity,
} from '../../types/project.js';

/**
 * 评估项目成熟度等级
 *
 * 规则：
 * - greenfield: 文件数 < 5 且没有 Git 仓库（全新项目）
 * - legacy:     文件数 > 200 且缺少现代工具链（老旧项目）
 * - mature:     拥有测试、CI、文档（成熟项目）
 * - growing:    其他情况（成长中项目）
 */
export function assessMaturity(
  techStack: TechStackInfo,
  structure: ProjectStructure,
  collaboration: CollaborationInfo,
  _platforms: PlatformDetectionResult
): ProjectMaturity {
  // greenfield: 几乎为空且无版本控制
  if (structure.fileCount < 5 && collaboration.hasGit === false) {
    return 'greenfield';
  }

  // legacy: 文件很多但缺少现代工具链
  if (structure.fileCount > 200 && !techStack.hasTypeScript && techStack.buildTool === null) {
    return 'legacy';
  }

  // mature: 具备完整工程化设施
  if (structure.hasTests && structure.hasCI && structure.hasDocs) {
    return 'mature';
  }

  // 默认：成长中
  return 'growing';
}
