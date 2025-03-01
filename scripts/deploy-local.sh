#!/bin/bash
cd ..
cd liga-fe
npm i
npm run build
cp -rf ./dist/. ./../liga-be/Api/wwwroot