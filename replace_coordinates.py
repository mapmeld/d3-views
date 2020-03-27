import json

state_configs = {
  'ma': {
    'links': [
        "./ma_combined_results_20200327_40_util_euclidean.json",
        "./ma_combined_results_20200327_60_util_euclidean.json",
        "./ma_combined_results_20200327_80_util_euclidean.json",
    ],
    'hospitals': "./ma_hospitals.geojson",
    'colleges': "./ma_colleges.geojson",
  },
  'ny': {
    'links': "./NY_combined_results_20200325_v1.json",
    'hospitals': "./ny_hospitals.geojson",
    'colleges': "./ny_colleges.geojson",
  },
  'mi': {
    'links': "./MI_combined_results_20200325_v1.json",
    'hospitals': "./mi_hospitals.geojson",
    'colleges': "./mi_colleges.geojson",
  }
}

for state in list(state_configs.keys()):
    print(state)
    hospitals = json.loads(open(state_configs[state]['hospitals'], 'r').read())["features"]
    colleges = json.loads(open(state_configs[state]['colleges'], 'r').read())["features"]

    linkFiles = []
    if len(state_configs[state]['links'][0]) == 1:
        # one string
        linkFiles = [state_configs[state]['links']]
    else:
        linkFiles = state_configs[state]['links']

    for fname in linkFiles:
        links = json.loads(open(fname, 'r').read())

        # 'COLLEGE' 'NAME'

        for link in links:
            for hospital in hospitals:
                for col in ['NAME', 'SHORTNAME', 'FAC_NAME']:
                    if (col in hospital["properties"]) and (link['hospital'] == hospital["properties"][col]):
                        link['hospital'] = hospital['geometry']['coordinates']
                        break
                if type(link['hospital']) == type([]):
                    break
            for college in colleges:
                for col in ['NAME', 'COLLEGE']:
                    if (col in college["properties"]) and (link['college'] == college["properties"][col]):
                        link['college'] = college['geometry']['coordinates']
                        break
                if type(link['college']) == type([]):
                    break

        op = open(fname, 'w')
        op.write(json.dumps(links))
