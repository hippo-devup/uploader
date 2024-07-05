import plugin from '../../lib/plugins/plugin.js';
import fetch from 'node-fetch';
import { Group, segment } from 'oicq';
import { exec } from 'child_process';
import common from '../../lib/common/common.js';
import path from 'path';
import fs from 'fs';
import Setting from './components/setting.js';

const _path = path.join(path.resolve(), 'plugins/uploader');

export class uploadimg extends plugin {
    constructor () {
		super({
		  name: '定时同步',
		  dsc:  '定时同步目录中的文件',
		  event: 'message',
		  priority: 3000,
		  rule: [
			{
			  reg: '^#手动上传$',
			  fnc: 'uploadTest'
			},
			{
			  reg: '^#list$',
			  fnc: 'list'
			}
		  ]
		})
		
		this.crontable = {}
		this.task = []
		
		let gcfg = Setting.getConfig('cron')['groups']

		for (let i = 0; i < gcfg.length; i++) {
			this.task.push(
				{
					cron: gcfg[i][2],
					name: `定时上传图片文件${i}`
					fnc: () => this.upload(i),
					log: true
				}
			)
			
			let dDir = path.join(_path, 'upload', gcfg[i][0]);
			if (!fs.existsSync(dDir)) {
				fs.mkdirSync(dDir);
				logger.mark('creation directory', `Directory 'd' created at ${dDir}`);
			}
			
			this.crontable[gcfg[i][0]] = {idx: i, nextGroupPath: gcfg[i][1]}
		}
	}
	
	/**
	* 取得目录中的文件名列表
	**/
	getFilesList(groupPath) {
	  let facePath  = path.join(_path, 'upload', groupPath);
	  let faceFiles = []
	  fs.readdirSync(facePath).forEach(fileName => faceFiles.push(path.join(_path, 'upload', groupPath, fileName)));
	  return faceFiles
	}
	
	async sendFiles(e, title, randomFiles,groupPath, nextGroupPath) {
		let parentid = await this.getdirid(groupPath)
		if (!parentid) return
		
		for (let v of randomFiles) {
		  let finalPath = v;
		  try{
			  let stat = await e.group.fs.upload(finalPath, parentid, undefined, percentage => {logger.info(percentage, title)})
			  if (stat && stat.fid) {
				logger.info(finalPath, title)
				fs.rename(finalPath, finalPath.replace(groupPath, nextGroupPath), err => {})
			  }
		  } catch(uploaderr) {logger.info(finalPath + ':\n' + uploaderr.toString(), 'error')}
	    }
	}
	
	async uploadTest(e) {
		await e.reply('正在上传...')
		if (e.isGroup) {
			if (this.crontable[e.group_id]) {
				this.upload(this.crontable[e.group_id].idx)
			}
		}
		await e.reply('完成...')
	}
	
	async upload(idx) {
		let gcfg = Setting.getConfig('cron').groups
		let groupNo  = gcfg[idx][0]
		
		let faceFiles = this.getFilesList(groupNo)

		let obj = {isGroup: true, group: Bot.pickGroup(groupNo)}
		obj.group_id = obj.group.group_id
		this.sendFiles(obj, '定时同步', faceFiles, groupNo, gcfg[idx][1])
	}

	async getdirid(groupPath) {
		let group  = Bot.pickGroup(groupPath)
		let mylist = await group.fs.dir('/', 0, 100)
		let fid
		for (let item of mylist) {
			if (item.name == '上传文件') {
				fid = item.fid
			}
		}
		
		if (!fid) {
			try{
				let newdir = await group.fs.mkdir('上传文件')
				fid = newdir.fid
			}catch (err) {return undefined}
		}
		
		return fid
	}
	
	async list(e) {
		if (e.isGroup) {
			let mylist = await e.group.fs.dir('/', 0, 100)
			for (let item of mylist) {
				logger.info(item.fid, item.pid)
			}
			
			await e.reply('完成，查找到' + mylist.length + '个目录')
		}
	}
}