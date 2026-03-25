#!/bin/bash
# Importa o dataset de reparações para a base de dados autoRepair, coleção repairs
mongoimport --host localhost --db autoRepair --collection repairs --type json --file /docker-entrypoint-initdb.d/reparacoes.json --jsonArray
 
echo "Import concluído."