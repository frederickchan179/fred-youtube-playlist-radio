#!/usr/bin/env node
import { Command } from 'commander'
import { resolveRepoRoot } from '@radio/shared/paths'
import { importFromUrl, syncExisting } from '@radio/ingest'

const repoRoot = resolveRepoRoot(import.meta.url)

const program = new Command()

program
  .name('radio')
  .description('Personal YouTube playlist → local radio library')
  .showHelpAfterError()

program
  .command('import')
  .argument('<url>', 'YouTube playlist or video URL')
  .description('Import or refresh from URL (playlist sync or saved single video)')
  .action(async (url: string) => {
    try {
      await importFromUrl(repoRoot, url)
    } catch (error) {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
  })

program
  .command('sync')
  .argument('[playlistId]', 'Optional playlist id; syncs all if omitted')
  .description('Sync local playlists (only download missing / failed tracks)')
  .action(async (playlistId?: string) => {
    try {
      await syncExisting(repoRoot, playlistId)
    } catch (error) {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    }
  })

await program.parseAsync(process.argv)
