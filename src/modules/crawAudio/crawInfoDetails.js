import { map } from 'lodash';
import { JSDOM } from 'jsdom';

export default async ({ pageUrl }) => {
    // const pageUrl =
    //     'https://audiotruyenfull.com/the-loai/huyen-huyen/?min_sotap=41&max_sotap=366&min_vote=3&stt=hoan-thanh&ordr=nviews_total-desc';
    const dom = await JSDOM.fromURL(pageUrl);
    const info = dom.window.document.querySelectorAll('.entry-title a');
    await Promise.all(
        map([info[0]], async (item) => {
            const regex = /\/([^/]+)\/{0,1}$/;
            const singleStoryUrl = item.attributes.href.textContent;
            const infoDetailUrl = item.attributes.href.textContent;
            const storyId = regex.exec(infoDetailUrl)?.[1];
            const domInfo = await JSDOM.fromURL(infoDetailUrl);
            const document = domInfo.window.document;
            const title = document.querySelector('.entry-title')?.textContent;

            const infoElement = document.querySelector('.info-truyenth');

            const thumbnail = infoElement
                .querySelector('img')
                .getAttribute('data-src');

            const descriptionsStory =
                infoElement.querySelector('.contentth')?.textContent;

            const infoList = infoElement.querySelector('.info-list').innerHTML;

            // get author info
            const stringTagAuthor = infoList
                .match('Tác giả:.*Thể loại:')?.[0]
                .match('<a.*a>')?.[0];
            const template = document.createElement('template');
            template.innerHTML = stringTagAuthor;
            const tagAuthor = template.content.children[0];
            const authorUrl = tagAuthor.href;
            const matchedAuthorId = regex.exec(authorUrl);
            const author = {
                name: tagAuthor.textContent,
                url: authorUrl,
                id: matchedAuthorId?.[1],
            };

            // get genres info
            const stringTagsGenres = infoList
                .match('Thể loại:.*Loại:')?.[0]
                .match(/<a.*a>/);
            const divTag = document.createElement('div');
            divTag.innerHTML = stringTagsGenres;
            const tagsGenres = divTag.querySelectorAll('a');
            const genres = map(tagsGenres, (item) => {
                const genresName = item.textContent;
                const url = item.href;
                const matchedGenreId = regex.exec(url.replace(/\/$/, ''));
                return { name: genresName, url, id: matchedGenreId?.[1] };
            });

            const totalEpisode = infoList
                .match('Số tập.*Trạng thái')?.[0]
                .match('[0-9]+')?.[0];

            // get Episode info
            const audioContentElement = document.querySelectorAll(
                '.tad-field-content-audio'
            )[1];
            const items = audioContentElement.querySelectorAll(
                '.tad-field-content-items'
            );
            const episodesInfo = map(items, (item) => {
                const episode = item.id;
                const audioUrl = item.querySelector('b').id;
                return { episode, audioUrl };
            });

            const result = {
                id: storyId,
                url: singleStoryUrl,
                title,
                thumbnail,
                descriptions: descriptionsStory,
                author,
                totalEpisode,
                genres,
                items: episodesInfo,
            };
            console.log(result);
            return result;
        })
    );
};
