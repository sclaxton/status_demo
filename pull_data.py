import urllib2, json, threading

storage_tags = [ 'cluster', 'ram', 'ldisk', 'disk', 'hdfsdu' ]

def append_status(data, cloud_status_data, currcloud, label, value_name):
    max_val =  data[currcloud][value_name]['max']
    val =  data[currcloud][value_name]['val']
    value_type = "scalar"
    if value_name in storage_tags:
        value_type = "storage"

    cloud_status_data.update( { label : dict( value_type=value_type, value=val, max_val=max_val) } )

    ''' Requires settings.STATUS_URL and settings.STATUS where settings.STATUS
    is a list of tuples consisting of a display name and a dictionary with three
    entries: dashboard, idprefix, and type. For Example:
        STATUS = [
            ("Adler", {
                "dashboard": "OSDC Cloud2",
                "type": "cloud"
            }),
            ("OCC-Y", {
                "dashboard": "OCC-Y",
                "type": "map_reduce"
            }),
            ("OCC-Root", {
                "dashboard": "OCC-Root",
                "type": "storage"})
        ]
    TODO: need to get the storage portion worked out'''

STATUS = [
    ("Adler", {
        "dashboard": "OSDC Cloud2",
        "type": "cloud"
    }),
    ("Sullivan", {
        "dashboard": "OSDC-Sullivan",
        "type": "cloud"
    }),
    ("Conte PDC", {
        "dashboard": "conte-pdc",
        "type": "cloud"
    }),
    ("OCC-Y", {
        "dashboard": "OCC-Y",
        "type": "map_reduce"
    }),
    ("OCC-LVOC", {
        "dashboard": "OCC-LVOC-HADOOP",
        "type": "map_reduce"
    }),
    ("OCC-Root", {
        "dashboard": "OCC-Root",
        "type": "storage"}),
    ("Bionimbus PDC", {
        "dashboard":"Bionimbus-PDC",
        "type": "cloud"
    })
]

STATUS_URLS = ["http://dashboard.bionimbus.opensciencedatacloud.org/state.json",
"http://dashboard.opensciencedatacloud.org/state.json"]


def update_status():
    threading.Timer(3600.0, update_status).start()
    data = {}
    for url in STATUS_URLS:
        status_req = urllib2.Request(url)
        opener = urllib2.build_opener()
        try:
            this_one = json.loads(str(opener.open(status_req).read()), 'utf-8')
            data = dict(data.items() + this_one.items())
        except:
            #TODO: find correct exception and log that this happened
            pass

    update_times = {}
    status_data = {}

    status_attrs = {
        "cloud": [
            ('Storage Used', 'cluster'),
            ('Active Users', 'users'), ('VM Instances', 'vms'),
            ('VM Cores', 'cores'), ('VM RAM', 'ram'),
            ('VM Instance Storage', 'ldisk')],
        "map_reduce": [
            ('HDFS Storage', 'hdfsdu'),
            ('Active Jobs', 'jobs'), ('Active Users', 'users')],
        "storage" : [
            ('Storage Used', 'disk')]
    }

    for cloud_name, cloud in STATUS:
        if cloud["type"] == "storage":
            continue
        status_data[cloud_name] = {}

        if "dashboard" in cloud and cloud["dashboard"] in data:

            for attr_name, attr_id in status_attrs[cloud["type"]]:
                append_status(data, status_data[cloud_name],
                              cloud["dashboard"], attr_name, attr_id)

            update_times[cloud_name] = data[cloud["dashboard"]]['users']['stsh']
        else:
            update_times[cloud_name] = "None"

    #special for root here
    storage_names = ['OCC-Root']

    #old_ncbi_total = 333832
    #old_ncbi_max = 333832

    #storage_total = old_ncbi_total
    storage_total = 0
    max_storage = 0.0
    storage_percent = 0
    status_time = ""
    for storage_name in storage_names:
        if storage_name in data:
            status_data[storage_name] = {}
            for data_set_name in data[storage_name]:
                val = float(data[storage_name][data_set_name]['val'])
                storage_total = storage_total + val
                max_storage = float(data[storage_name][data_set_name]['max'])
                status_time = data[storage_name][data_set_name]['stsh']

                #max_storage = max_storage / 1024
                max_storage = max_storage
                #max_storage = max_storage + old_ncbi_max
                if max_storage != 0:
                    storage_percent = storage_total / max_storage

                    status_data[storage_name].update( { 'Storage Used' : dict( value_type="storage", value=storage_total, max_val=max_storage, percent=storage_percent) } )
                    update_times[storage_name] = status_time
                    #print('storage_total: ' + str(storage_total) + ' max_storage: ' + str(max_storage))
                else:
                    update_times[storage_name] = "None"

    final_data = {}

    for cloud in status_data:
        stats = status_data[cloud]
        final_data[cloud]={}
        final_data[cloud]["time"] = update_times[cloud]
        final_data[cloud]["stats"] = stats


    jsonString = json.dumps(final_data)

    with open("json.txt", "w") as text_file:
        text_file.write(jsonString)

    return;

update_status()
