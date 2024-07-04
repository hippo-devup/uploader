import fs from 'fs'
import lodash from 'lodash'

const _path = process.cwd()
const _cfgPath = `${_path}/plugins/uploader-plugin/components/`
let cfg = {}

try {
  if (fs.existsSync(_cfgPath + 'cfg.json')) {
    cfg = JSON.parse(fs.readFileSync(_cfgPath + 'cfg.json', 'utf8')) || {}
  }
} catch (e) {
  // do nth
}

let Cfg = {
  get (rote, def = '') {
    return lodash.get(cfg, rote, def)
  },
  set (rote, val) {
    lodash.set(cfg, rote, val)
    fs.writeFileSync(_cfgPath + 'cfg.json', JSON.stringify(cfg, null, '\t'))
  },
  del (rote) {
    lodash.set(cfg, rote, undefined)
    fs.writeFileSync(_cfgPath + 'cfg.json', JSON.stringify(cfg, null, '\t'))
  }
}

export default Cfg
