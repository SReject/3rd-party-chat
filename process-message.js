const disect = /^(?:@(\S+) )?:([^\s!@]+)!\S+ PRIVMSG \S+ :(.*)$/;

const base = {
    id: '',
    customRewardId: '',
    username: '',
    userId: '',
    rawText: '',
    tagged: false,
    isBot: false,
    isVip: false,
    isSubscriber: false,
    isFounder: false,
    isMod: false,
    isBroadcaster: false,
    isHighlighted: false,
    isCheer: false,
    whisper: false,
    action: false,
};

const processTags = rawTags => {

    rawTags = rawTags
        .trim()
        .replace(/^@/, '')
        .split(/;/g);

    const tags = {};

    rawTags.forEach(tag => {

        // split tag name and value
        tag = tag.split('=');

        // format tag name
        const name = tag[0];

        // format value
        const value = (tag[1] == null ? '' : tag[1]).replace(/\\(.)/g, (ignore, chr) => {
            switch (chr) {
                case ':':
                    return ';';
                case 'r':
                    return '\r';
                case 'n':
                    return '\n';
                case '\\':
                    return '\\';
                case 's':
                    return ' ';
                default:
                    return chr
            }
        });

        // store the tag
        tags[name] = value;
    });

    return tags;
};

module.exports = (msg, logger) => {

    const rawMessage = msg._raw;
    const parts = disect.exec(rawMessage);

    if (parts == null) {
        return;
    }

    const result = {
        ...base,
        badges: [],
        parts: [],
        roles: []
    };

    const tags = result.msgTags = processTags(parts[1]);

    result.id             = tags['id'];
    result.username       = tags['display-name'] || parts[2];
    result.userId         = tags['user-id'];
    result.isHighlighted  = tags['msg-id'] === 'highlighted-message';
    result.customRewardId = tags['custom-reward-id'];
    result.isCheer        = (!!tags['bits']) && Number.parseInt(tags['bits'], 10) > 0;

    result.rawText        = parts[3];
    result.parts          = msg.parseEmotes();

    return result;
};