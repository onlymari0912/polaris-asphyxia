import {readFileSync} from 'fs';
import {join} from 'path';

const RESOURCE_DIR = join(__dirname, '..', '..', 'resources');

export function readResource(name: string){
    return readFileSync(join(RESOURCE_DIR, name), 'utf8');
}

export function readJsonResource<T>(name: string, fallback: T): T{
    try{
        return JSON.parse(readResource(name)) as T;
    }catch{
        return fallback;
    }
}
