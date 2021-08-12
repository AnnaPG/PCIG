
# Import libraries needed to connect with database and to the data processing
import sys
import os
import pypyodbc
import scipy
import json
from scipy import stats, misc
from scipy.special import factorial
import csv
import seaborn
import matplotlib
import numpy as np
from matplotlib import pyplot as plt
import math
from pcig.database_settings import SERVER_NAME, SERVER_PORT, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PWD

# Database connection
connection_string = 'Driver={SQL Server};' + f'Server={SERVER_NAME};PORT={SERVER_PORT};Database={DATABASE_NAME};UID={DATABASE_USERNAME};PWD={DATABASE_PWD};'

# Function to collect data for the initial page (frequency of each cancer type)
def get_data_freq_cancer():
    # SQL connection
    connection = pypyodbc.connect(connection_string)
    cursor = connection.cursor()

    # SQL query
    sql = """SELECT CancerType, dcc_project_code, COUNT(*) AS N
            FROM (
	            SELECT SUBSTRING(dcc_project_code, 0, CHARINDEX('-', dcc_project_code)) AS CancerType, dcc_project_code
	            FROM Phenotype_ProjectCode
	            ) t
            GROUP BY CancerType, dcc_project_code
            ORDER BY CancerType, dcc_project_code"""
    cursor.execute(sql)
    results_set = cursor.fetchall()
    # Save cancer types and n
    labels = list()
    labels_detail = list()
    n = list()
    for row in results_set:
        labels.append(row[0])
        labels_detail.append(row[1])
        n.append(row[2])

    # Build the JSON
    data = {
        "data": n,
        "labels": labels,
        "labels_detail" : labels_detail

    }
    return data

# Function to collect all the data for the counters
def get_data_counters(cancer_type):
    # SQL connection
    connection = pypyodbc.connect(connection_string)
    cursor = connection.cursor()

    # Get total number of samples
    sql = """select count(*) from  Phenotype_ProjectCode pc
                LEFT JOIN Phenotype_DonorClinical dc ON dc.icgc_donor_id = pc.icgc_donor_id
                LEFT JOIN Phenotype_TumourHistology th ON th.icgc_specimen_id = dc.icgc_donor_id
                WHERE th.organ_system IS NOT NULL AND pc.dcc_project_code IS NOT NULL AND th.histology_abbreviation IS NOT NULL"""
    cursor.execute(sql)
    results_set = cursor.fetchall()
    total_samples = int(results_set[0][0])

    # Gender
    sql = """select donor_sex from  Phenotype_ProjectCode pc
                LEFT JOIN Phenotype_DonorClinical dc ON dc.icgc_donor_id = pc.icgc_donor_id
                LEFT JOIN Phenotype_TumourHistology th ON th.icgc_specimen_id = dc.icgc_donor_id
                WHERE pc.dcc_project_code LIKE '%""" + cancer_type + "%'"
    cursor.execute(sql)
    results_set = cursor.fetchall()
    # Declare empty list fill with gender values
    gender = list()
    for row in results_set:
        gender.append(row[0])

    # Average, minimum and maximum age
    sql = """SELECT 
                    CASE WHEN avg(donor_age_at_diagnosis) IS NULL THEN 0 ELSE avg(donor_age_at_diagnosis) END,
                    CASE WHEN min(donor_age_at_diagnosis) IS NULL THEN 0 ELSE min(donor_age_at_diagnosis) END, 
                    CASE WHEN max(donor_age_at_diagnosis) IS NULL THEN 0 ELSE max(donor_age_at_diagnosis) END
                FROM Phenotype_ProjectCode pc
                LEFT JOIN Phenotype_DonorClinical dc ON dc.icgc_donor_id = pc.icgc_donor_id 
                WHERE pc.dcc_project_code LIKE '%""" + cancer_type + "%'"
    cursor.execute(sql)
    results_set = cursor.fetchall()
    avg_age = float(results_set[0][0])
    min_age = int(results_set[0][1])
    max_age = int(results_set[0][2])

    # Expression samples
    #sql = """select * from Phenotype_ProjectCode pc
    #            LEFT JOIN INFORMATION_SCHEMA.COLUMNS col ON col.COLUMN_NAME =
    #            pc.icgc_donor_id
    #            LEFT JOIN Phenotype_TumourHistology th ON th.icgc_specimen_id
    #            = pc.icgc_donor_id
    #            WHERE th.organ_system LIKE '%""" + organ + "%' AND
    #            pc.dcc_project_code LIKE '%" + cancer_type + "%' AND
    #            th.histology_abbreviation LIKE '%" + histology + """%'
    #            AND (col.table_name = 'EXPR_IPS_1' or col.table_name =
    #            'EXPR_IPS_2') ORDER BY COLUMN_NAME"""

    sql = """select * from Phenotype_ProjectCode pc
                    LEFT JOIN IPS i ON i.[SAMPLE] = pc.icgc_donor_id
                    LEFT JOIN Phenotype_TumourHistology th ON th.icgc_specimen_id = pc.icgc_donor_id
                    WHERE pc.dcc_project_code LIKE '%""" + cancer_type + """%'
                    and i.[SAMPLE] is not NULL"""

    cursor.execute(sql)
    # Processing the data
    results_set = cursor.fetchall()
    samples_exp = list()
    for row in results_set:
        samples_exp.append(row[0])

    # SV samples
    sql = """select sv.[sample], count(*) AS 'n_sv' from StructuralVariant sv
                LEFT JOIN Phenotype_ProjectCode pc ON sv.[sample] = pc.icgc_donor_id 
                WHERE pc.dcc_project_code LIKE '%""" + cancer_type +"""%'
                group by sv.[sample]"""

    cursor.execute(sql)
    # Processing the data
    results_set = cursor.fetchall()
    samples_sv = list()
    for row in results_set:
        samples_sv.append(row[0])   

    # CNA samples
    sql = """select c.sampleID, count(*) AS 'n_cna' from output_CNApp c
                LEFT JOIN Phenotype_ProjectCode pc ON c.sampleID = pc.icgc_donor_id 
                WHERE pc.dcc_project_code LIKE '%""" + cancer_type +"""%'
                group by c.sampleID"""

    cursor.execute(sql)
    # Processing the data
    results_set = cursor.fetchall()
    samples_cna = list()
    for row in results_set:
        samples_cna.append(row[0])

    # TMB samples
    sql = """select tmb.[Sample], count(*) AS 'tmb' from TumorMutationalBurden tmb
                LEFT JOIN Phenotype_ProjectCode pc ON tmb.[Sample] = pc.icgc_donor_id 
                WHERE pc.dcc_project_code LIKE '%""" + cancer_type +"""%'
                group by tmb.[Sample]"""

    cursor.execute(sql)
    # Processing the data
    results_set = cursor.fetchall()
    samples_tmb = list()
    for row in results_set:
        samples_tmb.append(row[0])

    # Build the JSON with all the data
    data = {
        "total_samples": total_samples,
        "samples": len(gender),
        "avg_age": round(avg_age, 2),
        "min_age": min_age,
        "max_age": max_age,
        "females": gender.count('female'),
        "males": gender.count('male'),
        "samples_exp":  len(samples_exp),
        "samples_sv": len(samples_sv),
        "samples_cna": len(samples_cna),
        "samples_tmb": len(samples_tmb),
    }
    return data

# Function to collect data for correlations analysis with three parameters:
# organ, cancer_type and histology
def get_data_scores(cancer_type, indels):
    # Get query results
    cursor = get_cursor_data_query(cancer_type, indels)

    # List of fields needed
    fields = ["icgc_donor_id", "sample", "fcs", "bcs", "b2m", "tap1", "tap2", "hla_a", "hla_b", "hla_c", "hla_dpa1", "hla_dpb1", "hla_e", "hla_f", "pdcd1", "ctla4", "lag3", "tigit",
             "timm13", "cd27", "icos", "act_cd4", "act_cd8", "tem_cd4", "tem_cd8", "mdsc", "treg", "mhc", "ec", "sc", "cp", "purity", "ploidy", "tmb", "ncna", "sv",
             "ccl2", "ccl3", "ccl4", "ccl5", "ccl8", "ccl18", "ccl19", "ccl21", "cxcl9", "cxcl10", "cxcl11", "cxcl13", "chemokine_avg", "stromalscore", "immunescore"]
    # Declare a dictionary with list of each column
    values = {}
    for col in fields:
        values[col] = list()
    # Save values for each column
    for row in cursor:
        # Columns in the list
        for col in fields:
            try:
                values[col].append(float(row[col]))
            except:
                values[col].append(row[col])

    # Calculate Spearman and CI for all combinations with bcs and fcs, in fields
    spearman = {}
    for col in fields:
        spearman["bcs_" + col] = safe_spearman(values["bcs"], values[col])
        spearman["fcs_" + col] = safe_spearman(values["fcs"], values[col])
    
    # Spearman for purity/ploidy with SV
    spearman["sv_ploidy"] = safe_spearman(values["sv"], values["ploidy"])
    # Spearman for bcs, fcs, IPS with TMB
    spearman["mhc_tmb"] = safe_spearman(values["mhc"], values["tmb"])
    spearman["cp_tmb"] = safe_spearman(values["cp"], values["tmb"])
    spearman["ec_tmb"] = safe_spearman(values["ec"], values["tmb"])
    spearman["sc_tmb"] = safe_spearman(values["sc"], values["tmb"])
    
    spearman["tmb_stromalscore"] = safe_spearman(values["tmb"], values["stromalscore"])
    spearman["tmb_immunescore"] = safe_spearman(values["tmb"], values["immunescore"])
    # Spearman between bcs&fcs
    spearman["bcs_fcs"] = safe_spearman(values["bcs"], values["fcs"])
    
    # Call the function to calculte CI and regressión line for each graph
    confidence_interval = {}
    confidence_interval["bcs_mhc"] = get_confidence_interval(values["bcs"], values["mhc"])
    confidence_interval["bcs_ec"] = get_confidence_interval(values["bcs"], values["ec"])
    confidence_interval["bcs_sc"] = get_confidence_interval(values["bcs"], values["sc"])
    confidence_interval["bcs_cp"] = get_confidence_interval(values["bcs"], values["cp"])
    confidence_interval["bcs_ploidy"] = get_confidence_interval(values["bcs"], values["ploidy"])
    confidence_interval["bcs_chemokine_avg"] = get_confidence_interval(values["bcs"], values["chemokine_avg"])
    confidence_interval["bcs_stromalscore"] = get_confidence_interval(values["bcs"], values["stromalscore"])
    confidence_interval["bcs_immunescore"] = get_confidence_interval(values["bcs"], values["immunescore"])
    confidence_interval["fcs_mhc"] = get_confidence_interval(values["fcs"], values["mhc"])
    confidence_interval["fcs_ec"] = get_confidence_interval(values["fcs"], values["ec"])
    confidence_interval["fcs_sc"] = get_confidence_interval(values["fcs"], values["sc"])
    confidence_interval["fcs_cp"] = get_confidence_interval(values["fcs"], values["cp"])
    confidence_interval["fcs_ploidy"] = get_confidence_interval(values["fcs"], values["ploidy"])    
    confidence_interval["fcs_chemokine_avg"] = get_confidence_interval(values["fcs"], values["chemokine_avg"])
    confidence_interval["fcs_stromalscore"] = get_confidence_interval(values["fcs"], values["stromalscore"])
    confidence_interval["fcs_immunescore"] = get_confidence_interval(values["fcs"], values["immunescore"])
    confidence_interval["bcs_tmb"] = get_confidence_interval(values["bcs"], values["tmb"])
    confidence_interval["fcs_tmb"] = get_confidence_interval(values["fcs"], values["tmb"])
    confidence_interval["mhc_tmb"] = get_confidence_interval(values["mhc"], values["tmb"])
    confidence_interval["ec_tmb"] = get_confidence_interval(values["ec"], values["tmb"])
    confidence_interval["sc_tmb"] = get_confidence_interval(values["sc"], values["tmb"])
    confidence_interval["cp_tmb"] = get_confidence_interval(values["cp"], values["tmb"])
    confidence_interval["tmb_stromalscore"] = get_confidence_interval(values["tmb"], values["stromalscore"])
    confidence_interval["tmb_immunescore"] = get_confidence_interval(values["tmb"], values["immunescore"])
    confidence_interval["sv_ploidy"] = get_confidence_interval(values["sv"], values["ploidy"])

    # Call the function to calculate distribution curve
    distribution_curve = {}
    #distribution_curve["bcs_curve"] = get_distribution_curve(values["bcs"])
    distribution_curve["bcs_curve"] = get_distribution_line(values["bcs"])
    distribution_curve["fcs_curve"] = get_distribution_line(values["fcs"])
    distribution_curve["ploidy_curve"] = get_distribution_line(values["ploidy"])
    distribution_curve["sv_curve"] = get_distribution_line(values["sv"])
    distribution_curve["tmb_curve"] = get_distribution_line(values["tmb"])

    # Build JSON
    data = {
        # data
        "data": values,
        # spearman
        "spearman": spearman,
        # confidence interval
        "confidence_interval": confidence_interval,
        # Distribution curve
        "distribution_curve": distribution_curve
    }
    return data

def get_cursor_data_query(cancer_type, indels):
    # SQL connection
    connection = pypyodbc.connect(connection_string)
    cursor = connection.cursor()

    # Query to collect IPS, ploidy/purity and CNA
    sql = """select pc.icgc_donor_id, th.organ_system, pc.dcc_project_code, th.histology_abbreviation, ocna.FCS, ocna.BCS, 

             i.b2m, i.tap1, i.tap2, i.hla_a, i.hla_b, i.hla_c, i.hla_dpa1, i.hla_dpb1, i.hla_e, i.hla_f, i.pdcd1, i.ctla4, i.lag3, i.tigit,
             i.havcr2, i.cd274, i.pdcd1lg2, i.cd27, i.icos, i.ido1, i.aim2, i.birc3, i.brip1, i.ccl20, i.ccl4, i.ccl5, i.ccnb1, i.ccr7, i.dusp2,
             i.esco2, i.ets1, i.exo1, i.exoc6, i.iars, i.kif11, i.kntc1, i.nuf2, i.prc1, i.psat1, i.rgs1, i.rtkn2, i.samsn1, i.sell, i.trat1,
             i.act_cd4, i.adrm1, i.ahsa1, i.c1galt1c1, i.cct6b, i.cd37, i.cd3d, i.cd3e, i.cd3g, i.cd69, i.cd8a, i.cetn3, i.cse1l, i.gemin6,
             i.gnly, i.gpt2, i.gzma, i.gzmh, i.gzmk, i.il2rb, i.lck, i.mpzl1, i.nkg7, i.pik3ip1, i.ptrh2, i.timm13, i.zap70, i.act_cd8, i.atm,
             i.casp3, i.casq1, i.cd300e, i.dars, i.dock9, i.exosc9, i.ezh2, i.gde1, i.il34, i.ncoa4, i.nefl, i.pdgfrl, i.ptgs1, i.reps1, i.scg2,
             i.sdpr, i.siglec14, i.siglec6, i.tal1, i.tfec, i.tipin, i.tpk1, i.uqcrb, i.usp9y, i.wipf1, i.zcrb1, i.tem_cd4, i.acap1, i.apol3, i.arhgap10,
             i.atp10d, i.c3ar1, i.ccr5, i.cd160, i.cd55, i.cflar, i.cmklr1, i.dapp1, i.fcrl6, i.flt3lg, i.gzmm, i.hapln3, i.hla_dmb,
             i.ifi16, i.lime1, i.ltk, i.nfkbia, i.setd7, i.sik1, i.trib2, i.tem_cd8, i.ccr2, i.cd14, i.cd2, i.cd86, i.cxcr4, i.fcgr2a,
             i.fcgr2b, i.fcgr3a, i.fermt3, i.gpsm3, i.il18bp, i.il4r, i.itgal, i.itgam, i.parvg, i.psap, i.ptger2, i.ptges2, i.s100a8, i.s100a9, i.mdsc,
             i.ccl3l1, i.cd72, i.clec5a, i.foxp3, i.itga4, i.l1cam, i.lipa, i.lrp1, i.lrrc42, i.marco, i.mmp12, i.mnda, i.mrc1, i.ms4a6a, i.pelo, i.plek,
             i.prss23, i.ptgir, i.st8sia4, i.stab1, i.treg, i.mhc, i.ec, i.sc, i.cp, i.az, i.ips,

             pp.purity, pp.ploidy, a.TMB, b.nCNA, c.SV,

             cr.ccl2, cr.ccl3, cr.ccl4, cr.ccl5, cr.ccl8, cr.ccl18, cr.ccl19, cr.ccl21, cr.cxcl9, cr.cxcl10, cr.cxcl11, cr.cxcl13, cr.[AVG] as 'chemokine_avg',
             
             e.StromalScore, e.ImmuneScore,
             CASE WHEN pc.icgc_donor_id IN (SELECT DISTINCT([ICGC donor ID]) FROM Chromothripsis_Subjects) THEN 'YES' ELSE 'NO' END AS CTH
             from Phenotype_ProjectCode pc
             LEFT JOIN IPS i ON pc.icgc_donor_id  = i.[SAMPLE] 
             LEFT JOIN output_CNApp ocna ON ocna.sampleID = pc.icgc_donor_id 
             LEFT JOIN Phenotype_TumourHistology th ON th.icgc_specimen_id = pc.icgc_donor_id
             LEFT JOIN PurityPloidy pp ON pp.samplename = ocna.sampleID
             LEFT JOIN Chemokine_results cr ON cr.[SAMPLE] = pc.icgc_donor_id
             LEFT JOIN ESTIMATE_scores e on e.[NAME] = pc.icgc_donor_id"""

    # Add TMB indel subquery
    if indels:
        sql += " OUTER APPLY (select tmb.[Sample], count(*) AS 'TMB' from TumorMutationalBurden tmb where tmb.[Sample] = pc.icgc_donor_id AND tmb.effect IN ('Frame_Shift_Del', 'Frame_Shift_Ins') GROUP BY tmb.[Sample]) as a"
    else:
        sql += " OUTER APPLY (select tmb.[Sample], count(*) AS 'TMB' from TumorMutationalBurden tmb where tmb.[Sample] = pc.icgc_donor_id GROUP BY tmb.[Sample]) as a"

    # Add other subqueries
    sql +=  """ OUTER APPLY (select cna.sampleID, count(*) AS 'nCNA' from CopyNumber cna where cna.sampleID = pc.icgc_donor_id GROUP by cna.sampleID) as b
             OUTER APPLY (select sv.[sample], count(*) AS 'SV'  from StructuralVariant sv where sv.[sample] = pc.icgc_donor_id GROUP BY sv.[sample]) as c
             WHERE pc.dcc_project_code LIKE '%""" + cancer_type + """%'
             order by pc.icgc_donor_id"""
    cursor.execute(sql)
    return cursor

# Function to collect the SV effects
def get_data_sv_effect(cancer_type):
    # SQL connection
    connection = pypyodbc.connect(connection_string)
    cursor = connection.cursor()

    # Query
    sql = """select distinct(sv.effect), count(*) AS 'effect'  from  Phenotype_ProjectCode pc
                JOIN StructuralVariant sv ON sv.[sample] = pc.icgc_donor_id 
                WHERE pc.dcc_project_code LIKE '%""" + cancer_type + """%'
                AND sv.effect is not null
                group by sv.effect"""

    cursor.execute(sql)

    # Collect the values
    effect = list()
    n = list()
   
    for row in cursor:        
        effect.append(row[0])
        n.append(row[1])
  
    # JSON
    data = {
        "n_effect": n,
        "labels": effect,
    }
    return data

# Function to collect number of CNA for each sample and purity/ploidy
def get_data_cna(cancer_type):
    # SQL connection
    connection = pypyodbc.connect(connection_string)
    cursor = connection.cursor()

    # Query
    sql = """select distinct(pc.icgc_donor_id), count(*) AS 'nCNA', ploidy, purity from  Phenotype_ProjectCode pc
                JOIN PurityPloidy pp ON pc.icgc_donor_id = pp.samplename
                JOIN CopyNumber cn  ON cn.sampleID = pc.icgc_donor_id 
                WHERE pc.dcc_project_code LIKE '%""" + cancer_type + """%'
                group by pc.icgc_donor_id, ploidy, purity"""

    cursor.execute(sql)

    # Columns
    data = list()
   
    for row in cursor:   
        data.append((row[1], row[2]))
  
    return data

# Function to collect CTH data
def get_data_cth(cancer_type):
    # SQL connection
    connection = pypyodbc.connect(connection_string)
    cursor = connection.cursor()

    # Get all CTH (yes)
    sql = "SELECT DISTINCT([ICGC donor ID]) FROM Chromothripsis_Subjects"
    cursor.execute(sql)
    cth_yes = [row[0] for row in cursor]

    # Query for FCS and BCS data
    sql = """select icgc_donor_id, FCS, BCS from Phenotype_ProjectCode pc
                 JOIN output_CNApp c ON c.sampleID = pc.icgc_donor_id 
                WHERE pc.dcc_project_code LIKE '%""" + cancer_type + """%'
                order by pc.icgc_donor_id"""
    cursor.execute(sql)

    # Columns
    bcs_yes = list()
    fcs_yes = list()
    bcs_no = list()
    fcs_no = list()
   
    for row in cursor:
        if (row[0] in cth_yes):
            fcs_yes.append(row[1])
            bcs_yes.append(row[2])
        else:
            fcs_no.append(row[1])
            bcs_no.append(row[2])

    # Wilcoxon test
    wilcoxon_cth_bcs = list()
    wilcoxon_cth_fcs = list()

    wilcoxon_cth_bcs = scipy.stats.mannwhitneyu(bcs_yes,bcs_no)
    wilcoxon_cth_fcs = scipy.stats.mannwhitneyu(fcs_yes,fcs_no)



    data = {
        "bcs_yes": bcs_yes,
        "bcs_no": bcs_no,
        "fcs_yes": fcs_yes,
        "fcs_no": fcs_no,
        "wilcoxon_cth_bcs": wilcoxon_cth_bcs,
        "wilcoxon_cth_fcs": wilcoxon_cth_fcs,
    }
  
    return data

# Functions to fill the filters
def get_organs():
    # SQL connection
    connection = pypyodbc.connect(connection_string)
    cursor = connection.cursor()

    # Query
    sql = "select distinct(organ_system) from Phenotype_TumourHistology where organ_system IS NOT NULL ORDER BY organ_system"
    cursor.execute(sql)

    # Columns
    data = list()
    for row in cursor:   
        data.append(row["organ_system"])
 
    return data

def get_cancer_types(organ):
    # SQL connection
    connection = pypyodbc.connect(connection_string)
    cursor = connection.cursor()

    # Query
    sql = """select distinct(dcc_project_code) from Phenotype_ProjectCode c
            join Phenotype_TumourHistology h on h.icgc_specimen_id = c.icgc_donor_id
            where h.organ_system = '""" + organ + "' "
    cursor.execute(sql)

    # Columns
    cancer_types = list()
    for row in cursor:   
        cancer_types.append(row["dcc_project_code"])
  
    data = {
        "cancer_types": cancer_types
    }
    return data


def get_data_HLA(cancer_type):
    # SQL connection
    connection = pypyodbc.connect(connection_string)
    cursor = connection.cursor()

    # Obtenim els pacients que tenen del_q6HLA
    sql = """select sampleID from CopyNumber
			where (total_cn = 0 OR total_cn = 1) AND chr = 6
				AND (
						(
							([start] between 29941260 and 29945884) -- HLA-A
							OR ([end] between 29941260 and 29945884)
							OR ([start] <= 29941260 AND [end] >= 29945884)
						)
						OR 
						(
							([start] between 31353872 and 31357187) -- HLA-B
							OR ([end] between 31353872 and 31357187)
							OR ([start] <= 31353872 AND [end] >= 31357187)
						)
						OR
						(
							([start] between 31268749 and 31272086) -- HLA-C
							OR ([end] between 31268749 and 31272086)
							OR ([start] <= 31268749 AND [end] >= 31272086)
						)
				)"""
    cursor.execute(sql)
    q6HLA = [row[0] for row in cursor]

    # Obtenim les dades de IPS
    sql = """select ips.[SAMPLE], MHC, EC, SC, CP, StromalScore, ImmuneScore from IPS ips
                JOIN Phenotype_ProjectCode pc ON ips.[SAMPLE] = pc.icgc_donor_id 
                JOIN Phenotype_TumourHistology th ON th.icgc_specimen_id = pc.icgc_donor_id
                JOIN ESTIMATE_scores e on e.[NAME] = pc.icgc_donor_id 
                WHERE pc.dcc_project_code LIKE '%""" + cancer_type + """%'"""
    cursor.execute(sql)

    # Collect the values
    mhc_HLA_del = list()
    ec_HLA_del = list()
    sc_HLA_del = list()
    cp_HLA_del = list()
    stromal_HLA_del = list()
    immune_HLA_del = list()
    mhc_HLA_no_del = list()
    ec_HLA_no_del = list()
    sc_HLA_no_del = list()
    cp_HLA_no_del = list()
    stromal_HLA_no_del = list()
    immune_HLA_no_del = list()

    for row in cursor:        
        if (row[0] in q6HLA):
            mhc_HLA_del.append(row[1])
            ec_HLA_del.append(row[2])
            sc_HLA_del.append(row[3])
            cp_HLA_del.append(row[4])
            stromal_HLA_del.append(row[5])
            immune_HLA_del.append(row[6])
        else:
            mhc_HLA_no_del.append(row[1])
            ec_HLA_no_del.append(row[2])
            sc_HLA_no_del.append(row[3])
            cp_HLA_no_del.append(row[4])
            stromal_HLA_no_del.append(row[5])
            immune_HLA_no_del.append(row[6])

    # Wilcoxon test
    wilcoxon_mhc = scipy.stats.mannwhitneyu(mhc_HLA_del,mhc_HLA_no_del)
    wilcoxon_ec = scipy.stats.mannwhitneyu(ec_HLA_del,ec_HLA_no_del)
    wilcoxon_sc = scipy.stats.mannwhitneyu(sc_HLA_del,sc_HLA_no_del)
    wilcoxon_cp = scipy.stats.mannwhitneyu(cp_HLA_del,cp_HLA_no_del)
    wilcoxon_stromal = scipy.stats.mannwhitneyu(stromal_HLA_del,stromal_HLA_no_del)
    wilcoxon_immune = scipy.stats.mannwhitneyu(immune_HLA_del,immune_HLA_no_del)
  
    # JSON
    data = {
        "mhc_HLA_del": mhc_HLA_del,
        "mhc_HLA_no_del": mhc_HLA_no_del,
        "ec_HLA_del": ec_HLA_del,
        "ec_HLA_no_del": ec_HLA_no_del,
        "sc_HLA_del": sc_HLA_del,
        "sc_HLA_no_del": sc_HLA_no_del,
        "cp_HLA_del": cp_HLA_del,
        "cp_HLA_no_del": cp_HLA_no_del,    
        "stromal_HLA_del": stromal_HLA_del,
        "stromal_HLA_no_del": stromal_HLA_no_del,    
        "immune_HLA_del": immune_HLA_del,
        "immune_HLA_no_del": immune_HLA_no_del,        
        "wilcoxon_mhc": wilcoxon_mhc,        
        "wilcoxon_ec": wilcoxon_ec,        
        "wilcoxon_sc": wilcoxon_sc,
        "wilcoxon_cp": wilcoxon_cp,     
        "wilcoxon_stromal": wilcoxon_stromal,
        "wilcoxon_immune": wilcoxon_immune,
    }
    return data

def get_data_report(cancer_type, indels):
    # Get query results
    cursor = get_cursor_data_query(cancer_type, indels)
    
    # Get path to appdata directory
    directory = os.path.join(os.getenv('APPDATA'), 'PCIG')
    if not os.path.exists(directory):
        os.makedirs(directory)

    # Dump results to CSV
    with open(os.path.join(directory, 'Output.csv'), 'w', newline='') as file:
        headers = [x[0] for x in cursor.description]
        headers = ['n_mut' if i == 'tmb' else i for i in headers]
        writer = csv.writer(file)
        writer.writerow(headers)
        writer.writerows(cursor.fetchall())

    return file

def safe_spearman(x_data, y_data):
    # Copy the lists so they are unchanged
    x = x_data.copy()
    y = y_data.copy()
    # First remove all rows where any of the 2 values is null
    clean_array_pair(x, y)
    # Calculate spearman
    return scipy.stats.spearmanr(x, y)

def clean_array_pair(x, y):
    # Remove all rows where any of the 2 values is null
    for i in reversed(range(len(x))):
        if (x[i] == None or y[i] == None):
            del x[i]
            del y[i]

def get_confidence_interval(x_data, y_data):
    # Copy the lists so they are unchanged
    x = x_data.copy()
    y = y_data.copy()
    clean_array_pair(x, y)

    # If there is no data left in either array, return empty result
    if not x or not y:
        return {
            "x_reg": x,
            "y_reg": y,
            "path": "",
        }

    # Calculate confidence interval
    rg = seaborn.regplot(x, y)
    x = rg.get_lines()[0].get_xdata() # x-coordinate of points along the regression line
    y = rg.get_lines()[0].get_ydata() # y-coordinate
    p = rg.get_children()[1].get_paths() # The list of Path(s) bounding the shape of 95% confidence interval-transparent
    rg.get_figure().clf()
        
       
    path = ''  # Path of the confidence interval
    p_codes = {1:'M', 2: 'L', 79: 'Z'} # Dict to get the Plotly codes for commands to define the svg path
    for s in p[0].iter_segments():
        c = p_codes[s[1]]
        xx, yy = s[0]
        path += c + str('{:.5f}'.format(xx)) + ' ' + str('{:.5f}'.format(yy))

    # JSON
    data = {
        "x_reg": x.tolist(),
        "y_reg": y.tolist(),
        "path": path,
    }
    return data


# Function to get data for the boxplots acroos all cancer types
def get_data_boxplot():
    # SQL connection
    connection = pypyodbc.connect(connection_string)
    cursor = connection.cursor()

    # Query
    sql = """select SUBSTRING(dcc_project_code, 0, CHARINDEX('-', dcc_project_code)) AS cancertype, dcc_project_code, BCS, FCS, MHC, CP, EC, SC, StromalScore, ImmuneScore, ESTIMATEScore, [AVG]
            from Phenotype_ProjectCode p
            left join output_CNApp c on c.sampleID = p.icgc_donor_id
            left join IPS i on i.[SAMPLE] = p.icgc_donor_id
            left join ESTIMATE_scores e on e.[NAME] = p.icgc_donor_id
            left join Chemokine_results ch on ch.[SAMPLE] =  p.icgc_donor_id
            ORDER BY dcc_project_code
            """
    cursor.execute(sql)

    data_bcs = {}
    data_fcs = {}
    data_mhc = {}
    data_cp = {}
    data_ec = {}
    data_sc = {}
    data_stromal = {}
    data_immune = {}
    data_estimate = {}
    data_chemokine_avg = {}

    for row in cursor:
        project_code = row["dcc_project_code"]
        if project_code not in data_bcs:
            data_bcs[project_code] = list()
            data_fcs[project_code] = list()
            data_mhc[project_code] = list()
            data_cp[project_code] = list()
            data_ec[project_code] = list()
            data_sc[project_code] = list()
            data_stromal[project_code] = list()
            data_immune[project_code] = list()
            data_estimate[project_code] = list()
            data_chemokine_avg[project_code] = list()

        data_bcs[project_code].append(row["bcs"])
        data_fcs[project_code].append(row["fcs"])
        data_mhc[project_code].append(row["mhc"])
        data_cp[project_code].append(row["cp"])
        data_ec[project_code].append(row["ec"])
        data_sc[project_code].append(row["sc"])
        data_stromal[project_code].append(row["stromalscore"])
        data_immune[project_code].append(row["immunescore"])
        data_estimate[project_code].append(row["estimatescore"])
        data_chemokine_avg[project_code].append(row["avg"])

    data = {
        "data_bcs": data_bcs,
        "data_fcs": data_fcs,
        "data_mhc": data_mhc,
        "data_cp": data_cp,
        "data_ec": data_ec,
        "data_sc": data_sc,
        "data_stromal": data_stromal,
        "data_immune": data_immune,
        "data_estimate": data_estimate,
        "data_chemokine_avg": data_chemokine_avg,
    }
    return data


# Function to calculate distribution line
def get_distribution_line(array):
    
    x = [value for value in array if value != None]
    #check if normal distribution:
    k2, p = stats.normaltest(x)
    alpha = 1e-3
    size = len(x)*2
    if p > alpha:  # null hypothesis: x comes from a normal distribution
        mu = np.mean(x)
        sigma = np.std(x) #You manually calculated it but you can also use this built-in function
        data = np.random.normal(mu, sigma, size)

        count, bins, ignored = plt.hist(data, len(x), density=True)
        dist_line_x = bins
        dist_line_y = np.exp(np.square(x - mu) / (2 * np.square(sigma))) / np.sqrt(2 * math.pi * sigma) #1/(sigma * np.sqrt(2 * np.pi)) * np.exp( - (bins - mu)**2 / (2 * sigma**2))
    else:
        data = np.random.poisson(x)
        t = np.arange(data[0])
        d = np.exp(-5)*np.power(5, t)/factorial(t)
        x = np.power(t, 5)
        y = factorial(t)

        dist_line_x = t 
        dist_line_y = d

    # JSON
    data = {
        "dist_line_x": dist_line_x.tolist(),
        "dist_line_y": dist_line_y.tolist(),
    }

    return data
