import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Resolve monorepo root from any package under apps/* or packages/* */
export const resolveRepoRoot = (fromImportMetaUrl: string): string => {
  const here = path.dirname(fileURLToPath(fromImportMetaUrl))
  // packages/shared/src -> repo root is ../../../
  return path.resolve(here, '../../..')
}

export const libraryRoot = (repoRoot: string): string =>
  path.join(repoRoot, 'library')

export const playlistsRoot = (repoRoot: string): string =>
  path.join(libraryRoot(repoRoot), 'playlists')

export const playlistDir = (repoRoot: string, playlistId: string): string =>
  path.join(playlistsRoot(repoRoot), playlistId)

export const manifestPath = (repoRoot: string, playlistId: string): string =>
  path.join(playlistDir(repoRoot, playlistId), 'manifest.json')

export const archivePath = (repoRoot: string, playlistId: string): string =>
  path.join(playlistDir(repoRoot, playlistId), 'archive.txt')

export const tracksDir = (repoRoot: string, playlistId: string): string =>
  path.join(playlistDir(repoRoot, playlistId), 'tracks')
