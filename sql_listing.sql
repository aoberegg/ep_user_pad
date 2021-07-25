CREATE TABLE IF NOT EXISTS `GroupPads` (
	`GroupID` int(11) NOT NULL,
	`PadName` varchar(255) COLLATE utf8_bin NOT NULL,
	PRIMARY KEY (`GroupID`,`PadName`)
	);

CREATE TABLE IF NOT EXISTS `Groups` (
	`groupID` int(11) NOT NULL AUTO_INCREMENT,
	`name` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',
	PRIMARY KEY (`groupID`,`name`)
	);

CREATE TABLE IF NOT EXISTS `NotRegisteredUsersGroups` (
	`email` varchar(255) NOT NULL,
	`groupID` int(11) NOT NULL
	);

CREATE TABLE IF NOT EXISTS `User` (
	`userID` int(11) NOT NULL AUTO_INCREMENT,
	`name` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',
	`pwd` varchar(255) COLLATE utf8_bin DEFAULT NULL,
	`considered` tinyint(11) DEFAULT NULL,
	`SSO` tinyint(4) DEFAULT NULL,
	`FullName` varchar(255) COLLATE utf8_bin DEFAULT NULL,
	`considerationString` varchar(50) COLLATE utf8_bin DEFAULT NULL,
	`salt` varchar(255) COLLATE utf8_bin DEFAULT NULL,
	`active` int(1) DEFAULT NULL,
	PRIMARY KEY (`userID`,`name`)
	);

CREATE TABLE IF NOT EXISTS `UserGroup` (
	`userID` int(11) NOT NULL DEFAULT '0',
	`groupID` int(11) NOT NULL DEFAULT '0',
	`Role` int(11) DEFAULT NULL,
	PRIMARY KEY (`userID`,`groupID`)
	);
