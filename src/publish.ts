import exec from 'execa'
import tmp from 'tempy'
import { dedent, ii } from 'vtils'
import { join } from 'path'
import { license, version } from '../package.json'
import { PackageJson } from 'type-fest'
import { packages } from './packages'
import { readFileSync, writeFileSync } from 'fs'

ii(async () => {
  const licenseContent = readFileSync(join(__dirname, '../LICENSE')).toString()
  await Promise.all(
    packages.map(async pkgName => {
      const pkgDir = tmp.directory()
      writeFileSync(
        join(pkgDir, './package.json'),
        JSON.stringify(
          {
            name: `@jenerated/${pkgName}`,
            publishConfig: {
              registry: 'https://registry.npmjs.org/',
              access: 'public',
            },
            description: `Generated package for ${pkgName}.`,
            version: version,
            license: license,
            main: 'index.ts',
          } as PackageJson,
          null,
          2,
        ),
      )
      writeFileSync(
        join(pkgDir, './index.ts'),
        dedent`
          export * from '.jenerated/${pkgName}'
        `,
      )
      writeFileSync(
        join(pkgDir, './README.md'),
        dedent`
          # @jenerated/${pkgName}

          Generated package for ${pkgName}.
        `,
      )
      writeFileSync(join(pkgDir, './LICENSE'), licenseContent)
      await exec('npm', ['publish'], {
        cwd: pkgDir,
        stdio: 'inherit',
      })
      await exec('shx', ['rm', '-rf', pkgDir])
    }),
  )
})
