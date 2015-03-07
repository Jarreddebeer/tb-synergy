from collections import namedtuple
import math

BlockHeader = namedtuple("BlockHeader",["a_concentration",
                                        "b_concentration",
                                        "c_concentration"])

control_headings = ["plate_num","type","val"]
data_headings = ["a","b","c","lumo","plate_num"]
fics_headings = data_headings + ["fic"]

DataPoint = namedtuple("DataPoint", data_headings)
FicPoint = namedtuple("FicPoint", fics_headings)
ProcessedBlock = namedtuple("ProcessedBlock", ["data_points","controls","drug_controls"])
Control = namedtuple("Control", control_headings)
Mics = namedtuple("Mics",["a", "b", "c"])

def process_raw(input_file):
    """
    We assume that the input file has blocks of csv data separated by blank
    lines.

    Each block should have a header of
        Drug A concentration, Drug B increments in concentration, Drug C increments
        in concentration
    after which we should have data of the form as given in the initial excel
    sheets.
    """
    # TODO: document data standard a little better
    lines = [line.rstrip().lstrip() for line in input_file.readlines()]
    blocks, building_block = [], []
    for line in lines:
        if line == '':
            blocks.append(building_block)
            building_block = []
        else:
            building_block.append(line)
    blocks.append(building_block)

    data_points, controls = [], []
    processed_blocks = [process_block(block, i) for i, block in enumerate(blocks)]
    for i, block in enumerate(processed_blocks):
        data_points += block.data_points
        controls += block.controls
        controls += block.drug_controls
    return [controls, data_points]

def format_block(block):
    return [[float(x) for x in line.split(",")] for line in block]

def process_block(block, num):
    block = format_block(block)
    header = BlockHeader(*block[0])
    block = block[1:] # get rid of header

    data_points, controls, drug_controls = [], [], []

    # First and last columns are control data
    controls = [Control(num, "control", line[0]) for line in block]
    drug_controls = [Control(num, "drug_controls", line[-1]) for line in block]

    # Top corner of non-control data is a reading of A
    data_points.append(DataPoint(header.a_concentration,0,0,block[0][1], num))

    # First row, less the controls and A, is just B
    for i, val in enumerate(reversed(block[0][2:-1])):
        data_points.append(DataPoint(0, (i + 1) * header.b_concentration, 0, val, num))

    # Second column is just C
    for i, line in enumerate(reversed(block[1:])): # ignore reading for A
        data_points.append(DataPoint(0, 0, (i + 1) * header.c_concentration, line[1], num))

    # Now, lets clean up blocks so we can extract some data!
    data_block = [line[2:-1] for line in block[1:]]
    for c_index, line in enumerate(reversed(data_block)):
        for b_index, val in enumerate(reversed(line)):
            data_points.append(DataPoint(header.a_concentration,
                header.b_concentration * (b_index + 1),
                header.c_concentration * (c_index + 1),
                val, num))

    return ProcessedBlock(data_points, controls, drug_controls)

def format_entry(entry):
    return str(entry)

def write_controls(controls, control_file):
    control_file.write(",".join(control_headings) + "\n")
    for control in controls:
        control_file.write(",".join([format_entry(x) for x in control]) + "\n")

def write_data(data_points, data_file):
    data_file.write(",".join(fics_headings) + "\n")
    for point in data_points:
        data_file.write(",".join([format_entry(x) for x in point]) + "\n")

def find_mics(data_points):
    a = min([x for x in data_points if
            x.b == 0 and x.c == 0 and
            x.lumo < 65000],
            key=lambda y: y.a).a
    b = min([x for x in data_points if
            x.a == 0 and x.c == 0 and
            x.lumo < 65000],
            key=lambda y: y.b).b
    c = min([x for x in data_points if
            x.a == 0 and x.b == 0 and
            x.lumo < 65000],
            key=lambda y: y.c).c
    return Mics(a,b,c)


def calculate_fic(point, mics):
    return point.a/mics.a + point.b/mics.b + point.c/mics.c

def calc_fincs(data_points):
    mics = find_mics(data_points)
    return [FicPoint(*(x + (calculate_fic(x, mics),))) for x in data_points]

if __name__ == "__main__":
    # TODO: make this a CLI enabled file
    with open("public/data/raw_data") as f,\
        open("public/data/controls.csv", "w") as control_f,\
        open("public/data/drug_data.csv", "w") as data_f:
        controls, data_points = process_raw(f)
        fics = calc_fincs(data_points)
        write_controls(controls, control_f)
        write_data(fics, data_f)
